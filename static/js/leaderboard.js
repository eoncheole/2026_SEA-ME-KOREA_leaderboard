class LeaderboardManager {
    constructor() {
        this.rows = [];
        this.editIndex = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.columnCount = 3;
        this.showTeamNames = false;
        this.serverShowTeamNames = false;
        this.initElements();
        this.bindEvents();
        this.fetchLeaderboard();
        
        // 5초마다 서버 상태 폴링
        setInterval(() => this.checkServerStatus(), 5000);
    }

    initElements() {
        this.tbody1 = document.getElementById('leaderboard-body-1');
        this.tbody2 = document.getElementById('leaderboard-body-2');
        this.tbody3 = document.getElementById('leaderboard-body-3');
        this.tbodies = [this.tbody1, this.tbody2, this.tbody3];
        this.showNamesBtn = document.getElementById('show-names-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.themeToggleText = document.getElementById('theme-toggle-text');
    }

    bindEvents() {
        this.tbodies.forEach(tbody => tbody.addEventListener('click', (e) => this.handleTableClick(e)));
        this.showNamesBtn.addEventListener('mousedown', () => this.showTeamNamesTemporary());
        this.showNamesBtn.addEventListener('mouseup', () => this.hideTeamNamesTemporary());
        this.showNamesBtn.addEventListener('mouseleave', () => this.hideTeamNamesTemporary());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        window.addEventListener('resize', () => this.resizeStopwatch());
        window.addEventListener('DOMContentLoaded', () => this.resizeStopwatch());
        
        // 저장된 테마 적용
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.documentElement.classList.add('light-theme');
            document.body.classList.add('light-theme');
            this.themeToggleText.textContent = 'Switch to Dark Theme';
            this.updateIframesTheme('light');
        }
    }

    async fetchLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json();
            this.rows = Array.isArray(data) ? data : [];
            
            // 팀명 공개 여부도 같이 받아옴
            const visibilityResponse = await fetch('/api/names-visibility');
            const visibilityData = await visibilityResponse.json();
            this.serverShowTeamNames = visibilityData.show;
            this.showTeamNames = visibilityData.show;
            
            this.renderTable();
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    }

    async syncToServer() {
        try {
            await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaderboard: this.rows })
            });
        } catch (error) {
            console.error('Failed to sync leaderboard:', error);
        }
    }

    timeStrToMs(str) {
        if (!str || str.includes('기록 없음')) return Number.MAX_SAFE_INTEGER;
        
        // mm:ss.s (소수점 1자리)
        let match = str.match(/(\d{1,2}):(\d{1,2})\.(\d{1})$/);
        if (match) {
            const [, min, sec, tenths] = match;
            return parseInt(min) * 60000 + parseInt(sec) * 1000 + parseInt(tenths) * 100;
        }
        
        // 예전 데이터 호환용 (mm:ss.sss)
        match = str.match(/(\d{1,2}):(\d{1,2})\.(\d{3})$/);
        if (match) {
            const [, min, sec, ms] = match;
            return parseInt(min) * 60000 + parseInt(sec) * 1000 + parseInt(ms);
        }
        
        return Number.MAX_SAFE_INTEGER;
    }

    formatTime(timeInput) {
        const patterns = {
            standard: /^(\d{1,2}):(\d{1,2})\.(\d{1})$/,
            dotFormat: /^(\d{1,2})\.(\d{1,2})\.(\d{1})$/
        };

        if (patterns.standard.test(timeInput)) {
            const [min, second] = timeInput.split(':');
            const [sec, tenths] = second.split('.');
            return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}.${tenths}`;
        }

        if (patterns.dotFormat.test(timeInput)) {
            const [min, sec, tenths] = timeInput.split('.');
            return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}.${tenths}`;
        }

        return null;
    }

    sortRows() {
        this.rows.sort((a, b) => {
            const aBest = Math.min(this.timeStrToMs(a.time1), this.timeStrToMs(a.time2));
            const bBest = Math.min(this.timeStrToMs(b.time1), this.timeStrToMs(b.time2));
            
            if (aBest !== bBest) return aBest - bBest;
            return this.timeStrToMs(a.time2) - this.timeStrToMs(b.time2);
        });
    }

    getRankBadgeClass(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return 'rank-default';
    }

    renderRow(dataIndex) {
        const rank = dataIndex + 1;

        if (dataIndex >= this.rows.length) {
            // 빈 칸
            return `
                <tr class="empty-row">
                    <td><span class="rank-badge rank-default">${rank}</span></td>
                    <td><div class="team-name">-</div></td>
                    <td><span class="time-value">-</span></td>
                    <td><span class="time-value">-</span></td>
                </tr>
            `;
        }

        const row = this.rows[dataIndex];
        const t1ms = this.timeStrToMs(row.time1);
        const t2ms = this.timeStrToMs(row.time2);

        const time1Display = row.time1.replace('첫번째 시도: ', '');
        const time2Display = row.time2.replace('두번째 시도: ', '');

        const isBestTime1 = t1ms <= t2ms || row.time2.includes('기록 없음');

        return `
            <tr data-index="${dataIndex}">
                <td>
                    <span class="rank-badge ${this.getRankBadgeClass(rank)}">${rank}</span>
                </td>
                <td>
                    <div class="team-name">
                        ${this.showTeamNames ? `<span class="team-name-text">${row.name}</span>` : '<span class="team-name-mask">*******</span>'}
                        ${rank <= 5 ? `<span class="tooltip">🎖️<span class="tooltip-text">Top ${rank} performer!</span></span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="time-value ${isBestTime1 && !row.time1.includes('기록 없음') ? 'time-best' : 'time-secondary'}">${time1Display}</span>
                </td>
                <td>
                    <span class="time-value ${!isBestTime1 && !row.time2.includes('기록 없음') ? 'time-best' : 'time-secondary'}">${time2Display}</span>
                </td>
            </tr>
        `;
    }

    renderTable() {
        // 한 페이지에 30개 (한 열당 10개씩, 총 3열)
        const itemsPerPageTotal = this.itemsPerPage * this.columnCount;
        const totalPages = Math.ceil(Math.max(1, this.rows.length) / itemsPerPageTotal);
        const startIndex = (this.currentPage - 1) * itemsPerPageTotal;

        if (this.rows.length === 0) {
            // 데이터 없을 때 안내문구
            this.tbody1.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-state-icon">No Data</div>
                        <div class="empty-state-text">No entries yet!</div>
                        <div class="empty-state-subtext">Add your first record to get started</div>
                    </td>
                </tr>
            `;
            this.tbody2.innerHTML = '';
            this.tbody3.innerHTML = '';
            const paginationContainer = document.getElementById('pagination-container');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
            return;
        }

        // 각 열별로 렌더링
        this.tbodies.forEach((tbody, col) => {
            const tableRows = [];
            for (let i = 0; i < this.itemsPerPage; i++) {
                const dataIndex = startIndex + col * this.itemsPerPage + i;
                tableRows.push(this.renderRow(dataIndex));
            }
            tbody.innerHTML = tableRows.join('');
        });

        this.renderPagination(totalPages);
    }


    renderPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // 이전 버튼
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '‹';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.changePage(this.currentPage - 1);
        pagination.appendChild(prevBtn);
        
        // 페이지가 많으면 ... 으로 줄여서 표시
        const showPages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                showPages.push(i);
            }
        } else {
            const current = this.currentPage;
            if (current <= 4) {
                showPages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (current >= totalPages - 3) {
                showPages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                showPages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
            }
        }
        
        showPages.forEach(page => {
            if (page === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '…';
                pagination.appendChild(ellipsis);
            } else {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'pagination-btn';
                if (page === this.currentPage) {
                    pageBtn.classList.add('active');
                }
                pageBtn.textContent = page;
                pageBtn.onclick = () => this.changePage(page);
                pagination.appendChild(pageBtn);
            }
        });
        
        // 다음 버튼
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = '›';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => this.changePage(this.currentPage + 1);
        pagination.appendChild(nextBtn);
        
        paginationContainer.appendChild(pagination);
    }

    changePage(page) {
        const itemsPerPageTotal = this.itemsPerPage * this.columnCount;
        const totalPages = Math.ceil(Math.max(1, this.rows.length) / itemsPerPageTotal);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderTable();
    }

    handleTableClick(e) {
        const tr = e.target.closest('tr');
        if (!tr || tr.classList.contains('empty-row')) return;
        
        const index = parseInt(tr.getAttribute('data-index'));
        
        // 실제 데이터 있는 행인지 확인
        if (isNaN(index) || index >= this.rows.length) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this entry?')) {
                const teamName = this.rows[index].name;
                this.rows.splice(index, 1);

                // 삭제하고 나서 현재 페이지가 범위 벗어나면 보정
                const itemsPerPageTotal = this.itemsPerPage * this.columnCount;
                const totalPages = Math.ceil(Math.max(1, this.rows.length) / itemsPerPageTotal);
                if (this.currentPage > totalPages) {
                    this.currentPage = Math.max(1, totalPages);
                }
                
                this.renderTable();
                this.syncToServer();
                this.showMessage(`Entry for "${teamName}" deleted successfully!`, 'success');
                
            }
        }
    }

    // 버튼 누르고 있는 동안 잠깐 팀명 보여주기
    showTeamNamesTemporary() {
        this.showTeamNames = true;
        this.renderTable();
    }

    // 손 떼면 원래 상태(서버 설정)로 복귀
    hideTeamNamesTemporary() {
        this.showTeamNames = this.serverShowTeamNames;
        this.renderTable();
    }

    async checkServerStatus() {
        try {
            const visibilityResponse = await fetch('/api/names-visibility');
            const visibilityData = await visibilityResponse.json();
            
            if (this.serverShowTeamNames !== visibilityData.show) {
                this.serverShowTeamNames = visibilityData.show;
                this.showTeamNames = visibilityData.show;
                this.renderTable();
            }
        } catch (error) {
            console.error('Failed to check server status:', error);
        }
    }

    resizeStopwatch() {
        const iframe = document.getElementById('stopwatch-iframe');
        if (iframe) {
            const windowHeight = window.innerHeight;
            const offset = 300;
            const calculatedHeight = Math.max(400, windowHeight - offset);
            iframe.style.height = `${Math.min(calculatedHeight, 480)}px`;
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.contains('light-theme');
        
        if (isLight) {
            document.documentElement.classList.remove('light-theme');
            document.body.classList.remove('light-theme');
            document.body.style.background = '';
            this.themeToggleText.textContent = 'Switch to Light Theme';
            localStorage.setItem('theme', 'dark');
            this.updateIframesTheme('dark');
        } else {
            document.documentElement.classList.add('light-theme');
            document.body.classList.add('light-theme');
            document.body.style.background = '';
            this.themeToggleText.textContent = 'Switch to Dark Theme';
            localStorage.setItem('theme', 'light');
            this.updateIframesTheme('light');
        }
    }

    updateIframesTheme(theme) {
        const stopwatchIframe = document.getElementById('stopwatch-iframe');
        const timerIframe = document.getElementById('timer-iframe');
        
        const themeParam = theme === 'dark' ? '1' : '0';

        if (stopwatchIframe) {
            stopwatchIframe.src = `https://vclock.kr/embed/stopwatch/#theme=${themeParam}&color=3`;
            stopwatchIframe.style.background = theme === 'dark' ? '#000000' : '#ffffff';
        }

        if (timerIframe) {
            timerIframe.src = `https://vclock.kr/embed/timer/#countdown=00:05:00&enabled=0&theme=${themeParam}&color=3&ampm=1&sound=xylophone`;
            timerIframe.style.background = theme === 'dark' ? '#000000' : '#ffffff';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LeaderboardManager();
});