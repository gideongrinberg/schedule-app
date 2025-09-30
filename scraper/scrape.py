import json
import requests
from pathlib import Path
from tqdm.rich import tqdm

terms = ["2025 Fall"]

def download_schedule(term: str, school: str, dept: str | None):
    url = "https://registrar.washu.edu/classes-registration/class-schedule-search/"
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'Sec-Fetch-Site': 'same-origin',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'cors',
        'Origin': 'https://registrar.washu.edu',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
        'Referer': 'https://registrar.washu.edu/classes-registration/class-schedule-search/',
        'Sec-Fetch-Dest': 'empty',
        'X-Requested-With': 'XMLHttpRequest',
        'Priority': 'u=3, i',
    }


    data = {
        'term': term,
        'school': school,
    }

    if dept is not None:
        data['department'] = dept

    response = requests.post(url, headers=headers, data=data)
    return response.text

if __name__ == "__main__":
    with open("./scraper/schools.json") as f:
        schools = json.load(f)

    total = 0
    for school in schools:
        total += len(schools[school])

    total *= len(terms)
    pbar = tqdm(total=total, desc="Downloading catalogs")
    for term in terms:
        for school in schools: 
            if len(schools[school]) == 0:
                schedule = download_schedule(term, school, None)
                outdir = Path(f"./pages/{term}/{school}")
                outdir.mkdir(exist_ok=True, parents=True)
                with open(outdir/"page.html", "w") as f:
                    f.write(schedule)
                pbar.update(1)
            else:
                for dept in schools[school]:
                    schedule = download_schedule(term, school, dept)
                    school_name = "Other" if school == "Washington University in St. Louis" else school
                    dept_name = dept.replace("/", "-")
                    outdir = Path(f"./pages/{term}/{school_name}")
                    outdir.mkdir(exist_ok=True, parents=True)
                    with open(outdir / f"{dept_name}.html", "w") as f:
                        f.write(schedule)
                    pbar.update(1)
