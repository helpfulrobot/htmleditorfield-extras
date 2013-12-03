/**
 * Milkyway Multimedia
 * mwm.htmleditorfield-extras.js
 *
 * Add new features to the HTMLEditorField Dialogs
 *
 * @package milkyway/silverstripe-htmleditorfield-extras
 * @author Mellisa Hankins <mell@milkywaymultimedia.com.au>
 */

var _mwm = _mwm || {};
_mwm.editors = _mwm.editors || {};

(function ($) {
	$.entwine('ss', function ($) {
		$('textarea.htmleditor').entwine({
			redraw: function () {
				var self = this,
					id = self.attr('id'),
					key = id + '--' + window.location.pathname.replace(/\W/g, '');

				if(!id) {
					this._super();
					return;
				}

				var _old = ssTinyMceConfig,
					config = _mwm.editors.hasOwnProperty(key) ? _mwm.editors[key] : $.extend({}, ssTinyMceConfig);

				if (typeof config != 'undefined' && !config.hasOwnProperty('mwm')) {
					config.mwm = true;

					if(self.data('tinymceContentCss')) {
						config.old_content_css = ssTinyMceConfig.content_css;
						config.content_css = self.data('tinymceContentCss');
					}

					if(self.hasClass('limited-with-links') && config.hasOwnProperty('plugins') && config.plugins.indexOf('-ssbuttons') !== -1) {
						if(config.hasOwnProperty('theme_advanced_buttons1') && config.theme_advanced_buttons1.indexOf('sslink') === -1) {
							config.theme_advanced_buttons1 = config.theme_advanced_buttons1 + ',sslink,unlink';
						}
					}

					var _oldSetupCallback = ssTinyMceConfig.hasOwnProperty('setupcontent_callback') ? config.setupcontent_callback : null;

					config.setupcontent_callback = function (eId, body, doc) {
						var $me = $("#" + eId),
							$body = $(body);

						if ($me.length && $me.data("tinymceClasses"))
							$body.addClass($me.data("tinymceClasses"));

						if (_oldSetupCallback)
							_oldSetupCallback(eId, body, doc);
					};

					var _oldSetup = config.hasOwnProperty('setup') ? config.setup : null;

					config.setup = function (editor) {
						var allowed = 0,
							total = 0,
							curr = 0,
							$me = $("#" + editor.editorId),
							message = '';

						if ($me.attr("maxlength")) {
							var max = $me.attr("maxlength"),
								indicator = $me.data("tinymceMaxlengthIndicator"),
								$indicator = [];

							if(indicator) {
								message = ss.i18n._t('HTMLEditorField.THERE_ARE', 'There are') + ' ' + max + ' ' + ss.i18n._t('HTMLEditorField.CHARACTERS_LEFT', 'characters left');

								if(indicator && (typeof indicator == 'string' || indicator instanceof String))
									$indicator = $(indicator);

								if ($indicator.length) {
									$indicator.text(message);

									if (max <= 0)
										$indicator.addClass('error');
									else
										$indicator.removeClass('error');
								}
							}

							editor.onKeyUp.add(function (ed, e) {
								total = self.getTextCountFromEditor(ed);
								allowed = max - total;

								if(allowed < 0) allowed = 0;

								if(indicator) {
									message = ss.i18n._t('HTMLEditorField.THERE_ARE', 'There are') + ' ' + allowed + ' ' + ss.i18n._t('HTMLEditorField.CHARACTERS_LEFT', 'characters left');

									if ($indicator.length) {
										$indicator.text(message);

										if (allowed <= 0)
											$indicator.addClass('error');
										else
											$indicator.removeClass('error');
									}
									else{
										if(allowed <= 0) { }
										else if(curr != total)
											statusMessage(message);
									}
								}

								setTimeout(function() { curr = total }, 0);
							});

							editor.onChange.add(function (ed, e) {
								total = self.getTextCountFromEditor(ed);
								allowed = max - total;

								if(allowed < 0) allowed = 0;

								if(indicator) {
									message = ss.i18n._t('HTMLEditorField.THERE_ARE', 'There are') + ' ' + allowed + ' ' + ss.i18n._t('HTMLEditorField.CHARACTERS_LEFT', 'characters left');

									if ($indicator.length) {
										$indicator.text(message);

										if (allowed <= 0)
											$indicator.addClass('error');
										else
											$indicator.removeClass('error');
									}
									else{
										if(allowed <= 0) { }
										else if(curr != total)
											statusMessage(message);
									}
								}

								setTimeout(function() { curr = total }, 0);
							});

							editor.onKeyDown.add(function (ed, e) {
								if(!allowed) {
									total = self.getTextCountFromEditor(ed);
									allowed = max - total;
								}

								if (allowed <= 0 && e.keyCode != 8 && e.keyCode != 46) {
									tinymce.dom.Event.cancel(e);
									errorMessage(ss.i18n.sprintf(
										ss.i18n._t('HTMLEditorField.MAX_CHARACTERS', 'This field can only contain %s characters'),
										max
									));
								}
							});
						}

						if (_oldSetup)
							_oldSetup(editor);
					};
				}

				_mwm.editors[key] = config;

				ssTinyMceConfig = config;

				this._super();

				ssTinyMceConfig = _old;
			},
			getTextCountFromEditor: function (editor) {
				if (!editor)
					editor = this.getEditor();

				var text = editor.getContent().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
				text = text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

				return text ? text.length : 0;
			}
		});

		$('form.htmleditorfield-linkform').entwine({
			getEditorField: function(){
				return $('#' + this.getEditor().getInstance().editorId);
			},
			googleLinkTracking: function(){
				var $editor = this.getEditorField();
				return $editor.length && $editor.hasClass('google-link-tracking');
			},
			emailFriendly: function(){
				var $editor = this.getEditorField();
				return $editor.length && $editor.hasClass('email-friendly');
			},
			redraw: function() {
				this._super();

				var linkType = this.find(':input[name=LinkType]:checked').val(),
					emailFriendly = this.emailFriendly();

				if(this.googleLinkTracking())
					this.find('.google-analytics-tracking').show().find('.field').show();

				if(!emailFriendly && (linkType === 'internal' || linkType === 'external') && this.find('.field[id$="TargetModal"]').length) {
					this.find('.field[id$="TargetModal"]').show();
				}
			},
			getLinkAttributes: function(e) {
				var att = this._super(),
					$utm_source = this.find(':input[name=utm_source]');

				if(this.find(':input[name=TargetModal]').is(':checked'))
					att['data-toggle'] = 'modal';

				if(att.hasOwnProperty('href') && att['href'].indexOf('mailto:') != 0 && $utm_source.length && $utm_source.val()) {
					var utm_medium = this.find(':input[name=utm_medium]').val(),
						utm_term = this.find(':input[name=utm_term]').val(),
						utm_content = this.find(':input[name=utm_content]').val(),
						utm_campaign = this.find(':input[name=utm_campaign]').val(),
						params = {
							utm_source: encodeURIComponent($utm_source.val())
						};

					if(!utm_medium)
						params.utm_medium = encodeURIComponent('none');
					else
						params.utm_medium = utm_medium;

					if(utm_term)
						params.utm_term = encodeURIComponent(utm_term);

					if(utm_content)
						params.utm_content = encodeURIComponent(utm_content);

					if(utm_campaign)
						params.utm_campaign = encodeURIComponent(utm_campaign);

					if(att['href'].indexOf('?') != -1)
						att['href'] += '&amp;' + $.param(params).replace('&', '&amp;');
					else
						att['href'] += '?' + $.param(params);
				}

				return att;
			},
			getCurrentLink: function() {
				var selected = this._super(),
					gat = this.googleLinkTracking();

				if(selected !== null && !gat)
					return selected;

				var selectedEl = this.getSelection(),
					href = '', title = '';

				// We use a separate field for linkDataSource from tinyMCE.linkElement.
				// If we have selected beyond the range of an <a> element, then use use that <a> element to get the link data source,
				// but we don't use it as the destination for the link insertion
				var linkDataSource = null;
				if(selectedEl.length) {
					if(selectedEl.is('a')) {
						// Element is a link
						linkDataSource = selectedEl;
						// TODO Limit to inline elements, otherwise will also apply to e.g. paragraphs which already contain one or more links
						// } else if((selectedEl.find('a').length)) {
						// 	// Element contains a link
						// 	var firstLinkEl = selectedEl.find('a:first');
						// 	if(firstLinkEl.length) linkDataSource = firstLinkEl;
					} else {
						// Element is a child of a link
						linkDataSource = selectedEl = selectedEl.parents('a:first');
					}
				}
				if(linkDataSource && linkDataSource.length) this.modifySelection(function(ed){
					ed.selectNode(linkDataSource[0]);
				});

				// Is anchor not a link
				if (!linkDataSource.attr('href')) linkDataSource = null;

				if (linkDataSource) {
					if(linkDataSource.hasData('toggle') && linkDataSource.data('toggle') == 'modal') {
						selected.TargetModal = true;
					}
				}

				if(gat) {
					if(selected !== null) {
						var url = linkDataSource.attr('href').replace('&amp;', '&'),
							query = url.indexOf('?') != -1 ? url.substring(url.indexOf('?')+1, url.length) : '';

						if(query) {
							var utm = this.deparam(query),
								r;

							if(utm && !$.isEmptyObject(utm)){
								$.each(utm, function(i, e) {
									if(i.indexOf('utm_') == 0) {
										r = i + '=' + e;
										selected[i] = decodeURIComponent(e);
										url = url.replace(r, '').replace(/[\?|&]+$/, '');
									}
								});
							}

							if(url.match(/^\[sitetree_link(?:\s*|%20|,)?id=([0-9]+)\]?(#.*)?$/i)) {
								selected.LinkType = 'internal';
								selected.internal = RegExp.$1;
								selected.Anchor = RegExp.$2 ? RegExp.$2.substr(1) : '';

								if(selected.hasOwnProperty('external'))
									delete selected.external;
							}
							else
								selected.external = url;
						}
					}
					else {
						var $editor = this.getEditorField(),
							utm_source = $editor.data('utmSource'),
							utm_medium = $editor.data('utmMedium'),
							utm_term = $editor.data('utmTerm'),
							utm_content = $editor.data('utmContent'),
							utm_campaign = $editor.data('utmCampaign');

						if(utm_source)
							selected.utm_source = utm_source.indexOf('#') == 0 && $(utm_source).length ? ($(utm_source).is(':input') ? $(utm_source).val() : $(utm_source).text()) : utm_source;

						if(utm_medium)
							selected.utm_medium = utm_medium.indexOf('#') == 0 && $(utm_medium).length ? ($(utm_medium).is(':input') ? $(utm_medium).val() : $(utm_medium).text()) : utm_medium;

						if(utm_term)
							selected.utm_term = utm_term.indexOf('#') == 0 && $(utm_term).length ? ($(utm_term).is(':input') ? $(utm_term).val() : $(utm_term).text()) : utm_term;

						if(utm_content)
							selected.utm_content = utm_content.indexOf('#') == 0 && $(utm_content).length ? ($(utm_content).is(':input') ? $(utm_content).val() : $(utm_content).text()) : utm_content;

						if(utm_campaign)
							selected.utm_campaign = utm_campaign.indexOf('#') == 0 && $(utm_campaign).length ? ($(utm_campaign).is(':input') ? $(utm_campaign).val() : $(utm_campaign).text()) : utm_campaign;
					}
				}

				return selected;
			},
			deparam: function (query) {
				// remove any preceding url and split
				query = query.substring(query.indexOf('?')+1).split('&');
				var params = {}, pair, d = decodeURIComponent, i;
				// march and parse
				for (i = query.length; i > 0;) {
					pair = query[--i].split('=');
					params[d(pair[0])] = d(pair[1]);
				}

				return params;
			}
		});
	});
})(jQuery);