import csv
import os
from typing import List, Dict

class LeaderboardModel:
    """리더보드 데이터를 CSV로 읽고 쓰는 모델"""

    def __init__(self, csv_file: str = 'leaderboard_data.csv'):
        self.csv_file = csv_file
        self.headers = ['Name', 'Time1', 'Time2']

    def load_data(self) -> List[Dict[str, str]]:
        leaderboard = []
        if os.path.exists(self.csv_file):
            try:
                with open(self.csv_file, newline='', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        leaderboard.append({
                            'name': row.get('Name', ''),
                            'time1': row.get('Time1', ''),
                            'time2': row.get('Time2', '')
                        })
            except Exception as e:
                print(f"데이터 로드 실패: {e}")
        return leaderboard

    def save_data(self, leaderboard: List[Dict[str, str]]) -> bool:
        try:
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(self.headers)
                for row in leaderboard:
                    writer.writerow([
                        row.get('name', ''),
                        row.get('time1', ''),
                        row.get('time2', '')
                    ])
            return True
        except Exception as e:
            print(f"데이터 저장 실패: {e}")
            return False

    def add_entry(self, name: str, time1: str, time2: str = '') -> bool:
        leaderboard = self.load_data()
        leaderboard.append({
            'name': name,
            'time1': time1,
            'time2': time2
        })
        return self.save_data(leaderboard)
    
    def update_entry(self, index: int, name: str, time1: str, time2: str = '') -> bool:
        leaderboard = self.load_data()
        if 0 <= index < len(leaderboard):
            leaderboard[index] = {
                'name': name,
                'time1': time1,
                'time2': time2
            }
            return self.save_data(leaderboard)
        return False
    
    def delete_entry(self, index: int) -> bool:
        leaderboard = self.load_data()
        if 0 <= index < len(leaderboard):
            del leaderboard[index]
            return self.save_data(leaderboard)
        return False