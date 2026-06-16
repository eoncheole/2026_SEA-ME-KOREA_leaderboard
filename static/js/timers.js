/**
 * 대회용 정확한 카운트다운 타이머
 *
 * 정확도 원리:
 *  - "매 틱마다 1씩 빼는" 방식은 setInterval 오차가 누적돼 시간이 밀린다.
 *  - 대신 시작 시점에 종료 시각(endTime = 현재 + duration)을 한 번 고정하고,
 *    매 프레임마다 remaining = endTime - performance.now() 를 다시 계산해 표시한다.
 *  - 탭이 백그라운드로 가거나 렉이 걸려도 누적 오차가 생기지 않는다.
 *  - 3분/5분 타이머는 같은 기준 시각(now0)으로 endTime을 잡아 완벽히 동기화된다.
 */

class CountdownTimer {
    constructor(displayEl, unitEl, durationSec) {
        this.displayEl = displayEl;
        this.unitEl = unitEl;
        this.durationMs = durationSec * 1000;
        this.endTime = null;
        this.finished = false;
        this.render(this.durationMs);
    }

    // 공통 기준 시각(now0)을 받아 종료 시각을 고정
    start(now0) {
        this.endTime = now0 + this.durationMs;
        this.finished = false;
        this.unitEl.classList.remove('timer-finished');
    }

    reset() {
        this.endTime = null;
        this.finished = false;
        this.unitEl.classList.remove('timer-finished');
        this.render(this.durationMs);
    }

    // 매 프레임 호출. 0에 막 도달했으면 true 반환(알림 트리거용)
    tick(now) {
        if (this.endTime === null) return false;

        const remaining = Math.max(0, this.endTime - now);
        this.render(remaining);

        if (remaining === 0 && !this.finished) {
            this.finished = true;
            this.unitEl.classList.add('timer-finished');
            return true; // 방금 종료됨
        }
        return false;
    }

    get running() {
        return this.endTime !== null && !this.finished;
    }

    render(ms) {
        // 올림 처리: 2999ms 같은 잔여를 03초로 보여줘 0초가 한 박자 머무르게 함
        const totalSec = Math.ceil(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        this.displayEl.textContent =
            `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
}

class TimerController {
    constructor() {
        this.timers = [];
        this.rafId = null;
        this.audioCtx = null;

        const unit3 = document.getElementById('timer-unit-3');
        const unit5 = document.getElementById('timer-unit-5');
        if (!unit3 || !unit5) return;

        this.timers.push(new CountdownTimer(
            document.getElementById('timer-display-3'), unit3,
            parseInt(unit3.dataset.duration, 10)
        ));
        this.timers.push(new CountdownTimer(
            document.getElementById('timer-display-5'), unit5,
            parseInt(unit5.dataset.duration, 10)
        ));

        this.startBtn = document.getElementById('timer-start-btn');
        this.resetBtn = document.getElementById('timer-reset-btn');
        this.startBtn.addEventListener('click', () => this.startAll());
        this.resetBtn.addEventListener('click', () => this.resetAll());
    }

    startAll() {
        // 사용자 제스처 안에서 오디오 컨텍스트 준비(브라우저 자동재생 정책)
        this.ensureAudio();

        // 단 하나의 기준 시각으로 두 타이머를 동시에 출발
        const now0 = performance.now();
        this.timers.forEach(t => t.start(now0));

        this.startBtn.textContent = '진행 중';
        this.startBtn.disabled = true;

        if (this.rafId === null) {
            this.loop();
        }
    }

    resetAll() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.timers.forEach(t => t.reset());
        this.startBtn.textContent = '시작';
        this.startBtn.disabled = false;
    }

    loop() {
        const now = performance.now();
        let anyRunning = false;

        this.timers.forEach(t => {
            const justFinished = t.tick(now);
            if (justFinished) this.notify();
            if (t.running) anyRunning = true;
        });

        if (anyRunning) {
            this.rafId = requestAnimationFrame(() => this.loop());
        } else {
            // 모든 타이머 종료
            this.rafId = null;
            this.startBtn.textContent = '시작';
            this.startBtn.disabled = false;
        }
    }

    // ----- 알림: 비프음 + 화면 깜빡임 -----
    ensureAudio() {
        if (!this.audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) this.audioCtx = new Ctx();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    notify() {
        this.beep();
    }

    beep() {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        // 삐- 삐- 삐 세 번
        [0, 0.25, 0.5].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
            osc.connect(gain).connect(ctx.destination);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.2);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TimerController();
});
