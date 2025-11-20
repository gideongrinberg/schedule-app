#! /usr/bin/env sh

uv run ./scraper/scrape.py
./scraper/transform.sh
uv run ./scraper/aggregate.py