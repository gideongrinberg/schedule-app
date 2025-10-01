#!/usr/bin/env sh

transform_page() {
  infile="$1"
  outfile="$2"

  tidy -config .tidyrc "$infile" \
  | xsltproc ./scraper/xsl/xhtml2courses.xsl - \
  | xsltproc ./scraper/xsl/courses2csv.xsl - \
  > "$outfile"
}

total=$(find pages -type f -print0 | tr -cd '\0' | wc -c)

find pages -type f -print0 |
while IFS= read -r -d '' infile; do
  relpath="${infile#pages/}"
  dir="csv/$(dirname "$relpath")"
  base="$(basename "$infile")"

  if [ "$base" = "page.html" ]; then
    outfile="$dir/all.csv"
  else
    case "$relpath" in
      *.*) outfile="csv/${relpath%.*}.csv" ;;
      *)   outfile="csv/${relpath}.csv" ;;
    esac
  fi

  mkdir -p "$(dirname "$outfile")"
  transform_page "$infile" "$outfile"
  echo "1"
done | uv run tqdm --total "$total" >/dev/null
