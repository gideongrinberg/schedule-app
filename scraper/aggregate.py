import os
import polars as pl

dfs = []
for term in os.listdir("./catalog/"):
    for school in os.listdir(f"./catalog/{term}/"):
        for file in os.listdir(f"./catalog/{term}/{school}/"):
            df = pl.read_csv(f"./catalog/{term}/{school}/{file}", schema_overrides={"section_number": pl.String})
            df = df.with_columns(pl.lit(school).alias("school"))
            dfs.append(df)

df = pl.concat(dfs)
df = df.with_columns(
    (pl.col("catalog_number") + " &mdash; " + pl.col("title")).alias("display_name")
)

df.write_parquet("./static/catalog.parquet")