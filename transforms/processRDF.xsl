<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" cdata-section-elements="header article" />
	<xsl:param name="minimal" value="0"/>
	
	<!-- TRANSLATES AN INCOMING RDF FEED TO A STANDARD FORMAT-->

	<xsl:template match="/">
		<!-- RDF/RSS 1.0 -->
		<xsl:variable name="rdf_sub_link" select="/*/*[name()='channel']/child::*[name()='link']"/>
		
		<items>
		<xsl:for-each select="/*/*[name()='item']">
			<item>
				<item_id>0</item_id>
				<sub_id>0</sub_id>
				<header><xsl:value-of select="child::*[name()='title']" disable-output-escaping="yes"/></header>
				<header_link><xsl:value-of select="child::*[name()='link']"/></header_link>
				<author />
				<source>S</source>
				<source_link><xsl:value-of select="$rdf_sub_link"/></source_link>
				<article><xsl:value-of select="normalize-space(child::*[name()='description'])" disable-output-escaping="yes" /></article>
				<xsl:if test="child::*[name()='dc:date']"><pubdate><xsl:value-of select="child::*[name()='dc:date']"/></pubdate></xsl:if>
				<status>0</status>
				<interval>0</interval>
			</item>		
		</xsl:for-each>
		</items>
		
	</xsl:template>
	
</xsl:stylesheet>