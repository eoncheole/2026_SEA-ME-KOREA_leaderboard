from flask import Flask
from config.settings import Config
from routes.leaderboard_routes import leaderboard_bp

def create_app():
    app = Flask(__name__)

    config = Config.get_config()
    app.config.from_object(config)
    app.register_blueprint(leaderboard_bp)

    return app

app = create_app()

if __name__ == '__main__':
    config = Config.get_config()
    app.run(debug=config.DEBUG, host=config.HOST, port=config.PORT)
