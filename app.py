import polars as pl
from flask import Flask, render_template, url_for, request

app = Flask(__name__)
catalog = pl.read_parquet(app.static_folder + "/catalog.parquet")
courses = catalog.select(["display_name", "course_id"]).unique().sort(by=pl.col("display_name")).to_dicts()

@app.route("/")
def index():
    return render_template("index.html", courses=courses)

@app.route("/generate")
def generate():
    return render_template("generate.html", redirect_to=url_for("schedule", **request.args.to_dict(flat=False)))

@app.route("/schedule")
def schedule():
    import time
    time.sleep(5)
    return "Ok"

if __name__ == "__main__":
    app.run(debug=True, port=8000)