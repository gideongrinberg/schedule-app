<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="xml" indent="yes"/>

  <xsl:template match="/">
    <courses>
      <xsl:for-each select="//*[contains(concat(' ', @class, ' '), ' scpi__classes--row ')]">
        <course>
          <id><xsl:value-of select="@data-course-id"/></id>

          <department>
            <xsl:value-of select=".//*[contains(concat(' ', @class, ' '), ' scpi-class__department ')]"/>
          </department>

          <title>
            <xsl:value-of select="normalize-space(.//*[contains(concat(' ', @class, ' '), ' scpi-class__heading ')][contains(@class,'wide')])"/>
          </title>

          <catalogNumber>
            <xsl:value-of select="normalize-space(.//*[contains(concat(' ', @class, ' '), ' scpi-class__heading ')][contains(@class,'middle')])"/>
          </catalogNumber>

          <units>
            <xsl:value-of select="normalize-space(.//*[contains(concat(' ', @class, ' '), ' scpi-class__heading ')][contains(@class,'narrow')])"/>
          </units>

          <xsl:for-each select=".//*[contains(concat(' ', @class, ' '), ' scpi-class__data ')]">
            <section id="{@data-section-id}">
              <number>
                <xsl:value-of select=".//*[contains(@class,'value-section-number')]"/>
              </number>
              <term>
                <xsl:value-of select=".//*[contains(@class,'value-term')]"/>
              </term>
              <instructor>
                <xsl:value-of select="normalize-space(.//*[contains(@class,'value-instructor')])"/>
              </instructor>
              <delivery>
                <xsl:value-of select=".//*[contains(@class,'value-delivery-mode')]"/>
              </delivery>
              <days>
                <xsl:value-of select=".//*[contains(@class,'value-days')]"/>
              </days>
              <time>
                <xsl:value-of select="normalize-space(.//*[contains(@class,'value-time')])"/>
              </time>
              <seats>
                <xsl:value-of select="normalize-space(.//*[contains(@class,'value-seating')])"/>
              </seats>
            </section>
          </xsl:for-each>

          <description>
            <xsl:value-of select="normalize-space(.//*[contains(@class,'scpi-class__details--content')])"/>
          </description>
        </course>
      </xsl:for-each>
    </courses>
  </xsl:template>
</xsl:stylesheet>
