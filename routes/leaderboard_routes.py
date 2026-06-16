from flask import Blueprint, render_template, request, jsonify
from models.leaderboard import LeaderboardModel

leaderboard_bp = Blueprint('leaderboard', __name__)
leaderboard_model = LeaderboardModel()

# 팀명 공개 여부 (관리자가 토글)
show_team_names = False

@leaderboard_bp.route('/')
def index():
    leaderboard = leaderboard_model.load_data()
    return render_template('leaderboard.html', leaderboard=leaderboard)

@leaderboard_bp.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = leaderboard_model.load_data()
    return jsonify(leaderboard)

@leaderboard_bp.route('/api/leaderboard', methods=['POST'])
def update_leaderboard():
    # 리더보드 전체 덮어쓰기
    try:
        data = request.get_json()
        if not data or 'leaderboard' not in data:
            return jsonify({'error': 'Invalid data format'}), 400
        
        leaderboard = data['leaderboard']
        if leaderboard_model.save_data(leaderboard):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leaderboard_bp.route('/api/leaderboard/entry', methods=['POST'])
def add_entry():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        time1 = data.get('time1', '').strip()
        time2 = data.get('time2', '').strip()
        
        if not name or not time1:
            return jsonify({'error': 'Name and time1 are required'}), 400
        
        if leaderboard_model.add_entry(name, time1, time2):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to add entry'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leaderboard_bp.route('/api/leaderboard/entry/<int:index>', methods=['PUT'])
def update_entry(index):
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        time1 = data.get('time1', '').strip()
        time2 = data.get('time2', '').strip()
        
        if not name or not time1:
            return jsonify({'error': 'Name and time1 are required'}), 400
        
        if leaderboard_model.update_entry(index, name, time1, time2):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to update entry'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leaderboard_bp.route('/api/leaderboard/entry/<int:index>', methods=['DELETE'])
def delete_entry(index):
    try:
        if leaderboard_model.delete_entry(index):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to delete entry'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leaderboard_bp.route('/admin')
def admin():
    leaderboard = leaderboard_model.load_data()
    return render_template('admin.html', leaderboard=leaderboard)

@leaderboard_bp.route('/api/toggle-names', methods=['POST'])
def toggle_names():
    # 팀명 공개/비공개 전환
    global show_team_names
    try:
        data = request.get_json()
        show_team_names = data.get('show', False)
        return jsonify({'success': True, 'show': show_team_names})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leaderboard_bp.route('/api/names-visibility', methods=['GET'])
def get_names_visibility():
    global show_team_names
    return jsonify({'show': show_team_names})