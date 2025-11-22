import os
import json
import collections
import polars as pl

term_dfs: dict[str, list[pl.DataFrame]] = collections.defaultdict(list)

for term_dir in os.listdir("./catalog/"):
    term_path = f"./catalog/{term_dir}"
    if not os.path.isdir(term_path):
        continue

    for school in os.listdir(term_path):
        school_path = f"{term_path}/{school}"
        if not os.path.isdir(school_path):
            continue

        for file in os.listdir(school_path):
            file_path = f"{school_path}/{file}"

            if not os.path.isfile(file_path):
                continue

            df = pl.read_csv(
                file_path,
                schema_overrides={"section_number": pl.String},
            )

            df = df.with_columns(pl.lit(school).alias("school"))
            term_dfs[term_dir].append(df)


def parse_time_field(field: str):
    return (
        pl.field(field)
        .str.strptime(pl.Time, "%I:%M %p")
        .dt.strftime("%R")
        .str.split_exact(":", 1)
        .struct.rename_fields(["h", "m"])
        .struct.with_fields(
            ((pl.field("h").cast(pl.Int64) * 60) + pl.field("m").cast(pl.Int64)).alias(
                field
            )
        )
        .struct.field(field)
    )


course_cols = [
    "course_id",
    "department",
    "title",
    "catalog_number",
    "units",
    "school",
    "display_name",
    "description",
]

section_cols = [
    "section_id",
    "section_number",
    "term",
    "instructor",
    "delivery",
    "days",
    "time",
    "seats",
]

with open("./scraper/schools.json") as f:
    schools = json.load(f)

catalogs_by_term: dict[str, dict] = {}

for term_dir, dfs in term_dfs.items():
    df = pl.concat(dfs)
    df = (
        df.with_columns(
            (pl.col("catalog_number") + " &mdash; " + pl.col("title")).alias(
                "display_name"
            )
        )
        .with_columns(
            # Units
            pl.col("units")
            .str.split(" ")
            .list.first()
            .cast(pl.Float32, strict=False)
            .alias("units"),
            # Days
            pl.col("days").str.split(" ").alias("days"),
            # Seats
            (
                pl.when(pl.col("seats").str.contains("/"))
                .then(
                    pl.col("seats")
                    .str.split_exact("/", 1)
                    .struct.rename_fields(["filled", "total"])
                    .struct.with_fields(
                        pl.field("filled").cast(pl.Int64, strict=False).alias("filled"),
                        pl.field("total").cast(pl.Int64, strict=False).alias("total"),
                    )
                )
                .otherwise(pl.lit(None))
                .alias("seats")
            ),
            # Times
            (
                pl.col("time")
                .str.split_exact("-", 1)
                .struct.rename_fields(["start", "end"])
                .struct.with_fields(parse_time_field("start"), parse_time_field("end"))
            ),
            # Instructors
            (
                pl.col("instructor")
                .str.split(";")
                .alias("instructor")
                .list.eval(pl.element().str.strip_chars(" "))
            ),
        )
        .with_columns(
            pl.when(
                pl.col("time").struct.field("start").has_nulls()
                | pl.col("time").struct.field("end").has_nulls()
            )
            .then(pl.lit(None))
            .otherwise(pl.col("time"))
            .alias("time")
        )
    )

    assert not ((set(course_cols) | set(section_cols)) - set(df.columns))
    df_grouped = (
        df.group_by(*course_cols)
        .agg(
            pl.struct(section_cols).alias("sections"),
            pl.col("term").unique().sort().alias("terms"),
        )
        .sort("display_name")
    )

    courses = json.loads(df_grouped.write_json())
    term_values = df_grouped["terms"].explode().unique().sort().to_list()

    instructors = (
        df_grouped["sections"]
        .explode()
        .struct.field("instructor")
        .drop_nulls()
        .explode()
        .unique()
        .sort()
        .to_list()
    )

    catalogs_by_term[term_dir] = {
        "meta": {
            "schools": schools,
            "terms": term_values,
            "instructors": instructors,
        },
        "courses": courses,
    }

catalogs_by_term = {
    term: catalogs_by_term[term]
    for term in sorted(
        catalogs_by_term.keys(),
        key=lambda s: (int(s.split()[0]), {"Spring": 0, "Fall": 1}[s.split()[1]]),
        reverse=True
    )
}

with open("app/src/lib/catalog.json", "w") as f:
    json.dump(catalogs_by_term, f)

print("Wrote per-directory-term catalogs to JSON file.")
