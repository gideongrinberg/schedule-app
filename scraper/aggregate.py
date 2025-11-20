import os
import polars as pl

dfs = []
for term in os.listdir("./catalog/"):
    for school in os.listdir(f"./catalog/{term}/"):
        for file in os.listdir(f"./catalog/{term}/{school}/"):
            df = pl.read_csv(
                f"./catalog/{term}/{school}/{file}",
                schema_overrides={"section_number": pl.String},
            )
            df = df.with_columns(pl.lit(school).alias("school"))
            dfs.append(df)

df: pl.DataFrame = pl.concat(dfs)


def parse_time_field(field: str):
    return (
        pl.field(field)
        .str.strptime(pl.Time, "%I:%M %p")
        .dt.strftime("%R")
        .str.split_exact(":", 1)
        .struct.rename_fields(["h", "m"])
        .struct.with_fields(
            ((pl.field("h").cast(pl.Int64) * 60) + pl.field("m").cast(pl.Int64)).alias(field)
        ).struct.field(field)
    )


df = df.with_columns(
    (pl.col("catalog_number") + " &mdash; " + pl.col("title")).alias("display_name")
).with_columns(  # Parse string fields
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
).with_columns(
    pl.when(pl.col("time").struct.field("start").has_nulls() | pl.col("time").struct.field("end").has_nulls())
    .then(pl.lit(None))
    .otherwise(pl.col("time"))
    .alias("time")
)

course_cols = [
    "course_id",
    "department",
    "title",
    "catalog_number",
    "units",
    "school",
    "display_name",
    "description"
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

assert not ((set(course_cols) | set(section_cols)) - set(df.columns))

df = (
    df.group_by(*course_cols)
    .agg(pl.struct(section_cols).alias("sections"), pl.col("term").unique().sort().alias("terms"))
    .sort("display_name")
)

df.write_json("app/src/lib/assets/catalog.json")
print("Wrote catalog to JSON file.")