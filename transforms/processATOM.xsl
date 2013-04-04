<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" cdata-section-elements="header article" />
	<xsl:param name="minimal" value="0"/>
	
	<!-- TRANSLATES AN INCOMING ATOM FEED TO A STANDARD FORMAT-->
	
	<xsl:template match="/" xmlns:atom="http://www.w3.org/2005/Atom">
		<!-- ATOM 1.0 --> 
		<xsl:variable name="atom_sub_link" select="atom:feed/atom:link/@href"/>

		<items>
		<xsl:for-each select="atom:feed/atom:entry">
			<item>
				<item_id>0</item_id>
				<sub_id>0</sub_id>
				<header><xsl:value-of select="atom:title" disable-output-escaping="yes"/></header>
				<header_link><xsl:value-of select="atom:link/@href"/></header_link>
				<xsl:choose>
					<xsl:when test="atom:author/atom:name">
						<author><xsl:value-of select="atom:author/atom:name"/></author>
					</xsl:when>
					<xsl:otherwise>
						<author />
					</xsl:otherwise>
				</xsl:choose>
				<source>S</source>
				<source_link><xsl:value-of select="$atom_sub_link" /></source_link>
				<xsl:choose>
					<xsl:when test="$minimal=1 and atom:summary">
						<article><xsl:value-of select="normalize-space(atom:summary)" disable-output-escaping="yes"/></article>
					</xsl:when>
					<xsl:otherwise>
						<xsl:choose>
							<xsl:when test="atom:summary">
								<article><xsl:value-of select="normalize-space(atom:summary)" disable-output-escaping="yes"/></article>
							</xsl:when>
							<xsl:otherwise>
								<article><xsl:value-of select="normalize-space(atom:content)" disable-output-escaping="yes"/></article>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="atom:updated">
						<pubdate><xsl:value-of select="atom:updated"/></pubdate>
					</xsl:when>
					<xsl:when test="atom:published">
						<pubdate><xsl:value-of select="atom:published"/></pubdate>
					</xsl:when>
				</xsl:choose>
				<status>0</status>
				<interval>0</interval>
			</item>		
		</xsl:for-each>
		</items>
			
	</xsl:template>

</xsl:stylesheet>