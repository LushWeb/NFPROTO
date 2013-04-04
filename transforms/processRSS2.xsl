<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" cdata-section-elements="header article" />
	<xsl:param name="minimal" value="0"/>
	
	<!-- TRANSLATES AN INCOMING RSS 2.0 FEED TO A STANDARD FORMAT-->

	<xsl:template match="/">
		
		<xsl:variable name="rss_sub_link" select="/rss/channel/link"/>

		<items>
		<xsl:for-each select="rss/channel/item">
			<item>
				<item_id>0</item_id>
				<sub_id>0</sub_id>
				<header><xsl:value-of select="title" disable-output-escaping="yes" /></header>
				<header_link><xsl:value-of select="link"/></header_link>
				<xsl:choose>
					<xsl:when xmlns:dc="http://purl.org/dc/elements/1.1/" test="dc:creator">
						<author><xsl:value-of select="dc:creator"/></author>
					</xsl:when>
					<xsl:otherwise>
						<author />
					</xsl:otherwise>
				</xsl:choose>
				<source>S</source>
				<source_link><xsl:value-of select="$rss_sub_link"/></source_link>
				<xsl:choose>
					<xsl:when test="$minimal=1 and description">
						<article><xsl:value-of select="normalize-space(description)" disable-output-escaping="yes"/></article>
					</xsl:when>
					<xsl:otherwise>
						<xsl:choose>
							<xsl:when xmlns:xhtml="http://www.w3.org/1999/xhtml" test="xhtml:body">
								<article><xsl:copy-of select="normalize-space(xhtml:body/*)"/></article>
							</xsl:when>
							<xsl:when xmlns:xhtml="http://www.w3.org/1999/xhtml" test="xhtml:div">
								<article><xsl:copy-of select="normalize-space(xhtml:div)"/></article>
							</xsl:when>
							<xsl:when xmlns:content="http://purl.org/rss/1.0/modules/content/" test="content:encoded">
								<article><xsl:value-of select="normalize-space(content:encoded)" disable-output-escaping="yes"/></article>
							</xsl:when>
							<xsl:when test="description">
								<article><xsl:value-of select="normalize-space(description)" disable-output-escaping="yes"/></article>
							</xsl:when>
						</xsl:choose>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:if test="pubDate"><pubdate><xsl:value-of select="pubDate"/></pubdate></xsl:if>
				<status>0</status>
				<interval>0</interval>
			</item>		
		</xsl:for-each>
		</items>

	</xsl:template>
	
</xsl:stylesheet>