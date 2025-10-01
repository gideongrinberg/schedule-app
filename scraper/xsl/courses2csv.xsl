<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="text" encoding="UTF-8"/>
  <xsl:strip-space elements="*"/>

  <xsl:template match="/">
    <xsl:text>course_id,department,title,catalog_number,units,section_id,section_number,term,instructor,delivery,days,time,seats,description&#x0A;</xsl:text>
    <xsl:for-each select="courses/course">
      <xsl:variable name="course_id"     select="string(id)"/>
      <xsl:variable name="department"    select="string(department)"/>
      <xsl:variable name="title"         select="string(title)"/>
      <xsl:variable name="catalogNumber" select="string(catalogNumber)"/>
      <xsl:variable name="units"         select="string(units)"/>
      <xsl:variable name="description"   select="string(description)"/>

      <xsl:for-each select="section">
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="$course_id"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="$department"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="$title"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="$catalogNumber"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="$units"/></xsl:call-template><xsl:text>,</xsl:text>

        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(@id)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(number)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(term)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(instructor)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(delivery)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(days)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(time)"/></xsl:call-template><xsl:text>,</xsl:text>
        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="string(seats)"/></xsl:call-template><xsl:text>,</xsl:text>

        <xsl:call-template name="csv-field"><xsl:with-param name="s" select="$description"/></xsl:call-template>
        <xsl:text>&#x0A;</xsl:text>
      </xsl:for-each>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="csv-field">
    <xsl:param name="s"/>
    <xsl:variable name="needsQuotes"
      select="contains($s, ',') or contains($s, '&quot;') or contains($s, '&#x0A;') or contains($s, '&#x0D;')"/>
    <xsl:choose>
      <xsl:when test="$needsQuotes">
        <xsl:text>"</xsl:text>
        <xsl:call-template name="double-quotes">
          <xsl:with-param name="s" select="$s"/>
        </xsl:call-template>
        <xsl:text>"</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$s"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="double-quotes">
    <xsl:param name="s"/>
    <xsl:choose>
      <xsl:when test="contains($s, '&quot;')">
        <xsl:value-of select="substring-before($s, '&quot;')"/>
        <xsl:text>""</xsl:text>
        <xsl:call-template name="double-quotes">
          <xsl:with-param name="s" select="substring-after($s, '&quot;')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$s"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
