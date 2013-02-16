<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" cdata-section-elements="header article" />
	<xsl:param name="subid" value="0"/>
	<xsl:param name="feedname" value="0"/>
	<xsl:param name="minimal" value="0"/>
	
	<!-- TRANSLATES AN INCOMING SET OF RSS FEEDS TO A STANDARD FORMAT-->
	<!-- FOR INCLUSION INTO master_?.xml CURRENTLY CATERS FOR RSS3.0, RSS1.0 AND ATOM-->

	<xsl:template match="/">
		<xsl:choose>
			<xsl:when test="rss/channel/title">
				<xsl:call-template name="rss-template" />
			</xsl:when>
			<xsl:when xmlns:atom="http://www.w3.org/2005/Atom" test="atom:feed/atom:title">
				<xsl:call-template name="atom-template" />
			</xsl:when>
			<xsl:when xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" test="rdf:RDF">
				<xsl:call-template name="rdf-template" />
			</xsl:when>
			<xsl:otherwise>
				<items><item>Unknown Format</item></items>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="rss-template">
		<!-- RSS --> 
		
		<xsl:variable name="rss_sub_link" select="/rss/channel/link"/>

		<items>
		<xsl:for-each select="rss/channel/item">
			<item>
				<item_id>0</item_id>
				<sub_id><xsl:value-of select="$subid"/></sub_id>
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
				<source><xsl:value-of select="$feedname"/></source>
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
				<pubdate><xsl:value-of select="pubDate"/></pubdate>
				<status>0</status>
				<grp_id>0</grp_id>
				<interval>0</interval>
			</item>		
		</xsl:for-each>
		</items>
	</xsl:template>
	
	<xsl:template name="atom-template" xmlns:atom="http://www.w3.org/2005/Atom">
		<!-- ATOM 1.0 --> 
		<xsl:variable name="atom_sub_link" select="atom:feed/atom:link/@href"/>

		<items>
		<xsl:for-each select="atom:feed/atom:entry">
			<item>
				<item_id>0</item_id>
				<sub_id><xsl:value-of select="$subid" /></sub_id>
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
				<source><xsl:value-of select="$feedname" /></source>
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
					<xsl:otherwise>
						<pubdate><xsl:value-of select="atom:published"/></pubdate>
					</xsl:otherwise>
				</xsl:choose>
				<status>0</status>
				<grp_id>0</grp_id>
				<interval>0</interval>
			</item>		
		</xsl:for-each>
		</items>
			
	</xsl:template>

	<xsl:template name="rdf-template">
		<!-- RSS 1.0 -->
		<xsl:variable name="rdf_sub_link" select="/*/*[name()='channel']/child::*[name()='link']"/>
		
		<items>
		<xsl:for-each select="/*/*[name()='item']">
			<item>
				<item_id>0</item_id>
				<sub_id><xsl:value-of select="$subid"/></sub_id>
				<header><xsl:value-of select="child::*[name()='title']" disable-output-escaping="yes"/></header>
				<header_link><xsl:value-of select="child::*[name()='link']"/></header_link>
				<author />
				<source><xsl:value-of select="$feedname"/></source>
				<source_link><xsl:value-of select="$rdf_sub_link"/></source_link>
				<article><xsl:value-of select="normalize-space(child::*[name()='description'])" disable-output-escaping="yes" /></article>
				<pubdate><xsl:value-of select="child::*[name()='dc:date']"/></pubdate>
				<status>0</status>
				<grp_id>0</grp_id>
				<interval>0</interval>
			</item>		
		</xsl:for-each>
		</items>
		
	</xsl:template>
	
</xsl:stylesheet>