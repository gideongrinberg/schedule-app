#! /usr/bin/env sh

tidy -config .tidyrc "$1" | \
xsltproc ./scraper/xsl/xhtml2courses.xsl - | \
xsltproc ./scraper/xsl/courses2json.xsl - > \
"$2"
