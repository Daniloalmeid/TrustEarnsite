# app.py
from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

# Print current directory and static folders for debugging
print(f"Current directory: {os.getcwd()}")
print(f"CSS Folder: {os.path.join(os.getcwd(), 'css')}")
print(f"JS Folder: {os.path.join(os.getcwd(), 'js')}")

# Serve static files (CSS and JS)
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

# Routes for HTML pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/evaluate')
def evaluate():
    return render_template('evaluate.html')

@app.route('/product')
def product():
    return render_template('product.html')

@app.route('/rewards')
def rewards():
    return render_template('rewards.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/submit-product')
def submit_product():
    return render_template('submit-product.html')

@app.route('/admin-dashboard')
def admin_dashboard():
    return render_template('admin-dashboard.html')

@app.route('/how-it-works')
def how_it_works():
    return render_template('how-it-works.html')

@app.route('/logged')
def logged():
    return render_template('logged.html')

if __name__ == '__main__':
    app.run(debug=True, port=8000)