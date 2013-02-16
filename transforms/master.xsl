<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" indent="yes" encoding="UTF-8" />
	<xsl:param name="subid" />
	<xsl:param name="grpid" />
	<xsl:param name="itemstatus" />
	
	<!-- USED FOR DISPLAYING master_?.xml ARTICLES DEPENDANT ON GROUP, SUB AND STATUS -->
		
	<xsl:template name="itemloop" match="/">
		<!-- <p>SELECTED SUB:<xsl:value-of select="$subid"/> - SELECTED GRP:<xsl:value-of select="$grpid"/> - SELECTED STATUS:<xsl:value-of select="$itemstatus"/></p> -->
		<xsl:choose>
			<xsl:when test="$subid=0 and $grpid=0">
				<xsl:for-each select="items/item[status=$itemstatus]">
					<xsl:sort select="interval" order="descending" />
					<xsl:call-template name="doIt" />
				</xsl:for-each>
			</xsl:when>
			<xsl:when test="$subid=0 and $grpid!=0">
				<xsl:for-each select="items/item[grp_id=$grpid and status=$itemstatus]">
					<xsl:sort select="interval" order="descending" />
					<xsl:call-template name="doIt" />
				</xsl:for-each>
			</xsl:when>
			<xsl:otherwise>
				<xsl:for-each select="items/item[sub_id=$subid and status=$itemstatus]">
					<xsl:sort select="interval" order="descending" />
					<xsl:call-template name="doIt" />
				</xsl:for-each>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="doIt">
		<xsl:choose>
			<xsl:when test="status=0">
				<!-- Unread Items -->
				<div class="itemWrapperUnread" id="art_{item_id}">
					<p class="itemTitle">
						<a target="_blank" href="{header_link}"><xsl:value-of select="header" disable-output-escaping="yes" /></a>
					</p>
					<p class="itemSource">
						<a class="itemSource" target="_blank" href="{source_link}"><xsl:value-of select="source" disable-output-escaping="yes" /></a>
						<xsl:if test="author!=''"><xsl:text> [ </xsl:text><xsl:value-of select="author"/><xsl:text> ]</xsl:text></xsl:if>
					</p>
					<p class="itemDate"><xsl:value-of select="interval"/></p>
					<hr class="itemPartition"/>
					<div class="itemTextWrapper">
						<div class="itemText">
							<xsl:value-of select="article" disable-output-escaping="yes"/>
						</div>
					</div>
					<p class="itemEnd" />
					<div class="optionWrapper">
						<div class="btn bNormal" id="mar_{item_id}" onclick="markStatusAs(this,1,{sub_id});">Mark as Read</div><div class="buttonSpacer"/>
						<div class="btn bNormal" id="mab_{item_id}" onclick="markStatusAs(this,2,{sub_id});">Bookmark</div>
					</div>
					
				</div>					
			</xsl:when>
			<xsl:when test="status=1">
				<!-- Read Items (shorter version) -->
				<div class="itemWrapperRead" id="art_{item_id}">
					<p class="itemTitleRead">
						<a target="_blank" href="{header_link}"><xsl:value-of select="header" disable-output-escaping="yes" /></a>
					</p>
					<p class="itemSource">
						<a class="itemSource" target="_blank" href="{source_link}"><xsl:value-of select="source" disable-output-escaping="yes" /></a>
						<xsl:if test="author!=''"><xsl:text> [ </xsl:text><xsl:value-of select="author"/><xsl:text> ]</xsl:text></xsl:if>
					</p>
					<p class="itemDate"><xsl:value-of select="interval"/></p>
					<p class="itemEnd" />
					<div class="optionWrapper">
						<div class="btn bNormal" id="mau_{item_id}" onclick="markStatusAs(this,0,{sub_id});">Mark as Unread</div><div class="buttonSpacer"/>
						<div class="btn bNormal" id="mab_{item_id}" onclick="markStatusAs(this,2,{sub_id});">Bookmark</div>
					</div>
				</div>					
			</xsl:when>
			<xsl:when test="status=2">
				<!-- Bookmarked Items [TBA] -->
				<div class="itemWrapperBookmarked" id="art_{item_id}">
					<p class="itemTitle">
						<a target="_blank" href="{header_link}"><xsl:value-of select="header" disable-output-escaping="yes"/></a>
					</p>
					<p class="itemSource">
						<a class="itemSource" target="_blank" href="{source_link}"><xsl:value-of select="source" disable-output-escaping="yes" /></a>
						<xsl:if test="author!=''"><xsl:text> [ </xsl:text><xsl:value-of select="author"/><xsl:text> ]</xsl:text></xsl:if>
					</p>
					<p class="itemDate"><xsl:value-of select="interval"/></p>
					<hr class="itemPartition"/>
					<div class="itemTextWrapper">
						<div class="itemText">
							<xsl:value-of select="article" disable-output-escaping="yes"/>
						</div>
					</div>
					<p class="itemEnd"/>
					<div class="optionWrapper">
						<div class="btn bNormal" id="mar_{item_id}" onclick="markStatusAs(this,1,{sub_id});">Mark as Read</div>
					</div>
				</div>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>