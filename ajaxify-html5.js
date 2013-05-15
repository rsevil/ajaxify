// Ajaxify
// v2.0 work in progress
// https://github.com/prod4ever/ajaxify

(function( $ ){
	$.fn.ajaxify = function ( options ) {

		// Prepare our Variables
		var
			History = window.History,
			$ = window.jQuery,
			document = window.document,
			$ajaxifyTarget = this; // The element on which Ajaxify was called. Any links in this element will trigger an AJAX load.

		// Check to see if History.js is enabled for our Browser
		if ( !History.enabled ) {
			return false;
		}

		// Settings
		var settings = $.extend( {
			contentSelector : 'main,#main,#content,article:first,.article:first,.post:first',
			linkContainerSelector : '',
			menuSelector : '#menu,#nav,nav:first,.nav:first',
			activeClass : 'active selected current youarehere',
			activeSelector : '.active,.selected,.current,.youarehere',
			menuChildrenSelector : '> li,> ul > li',
			completedEventName : 'statechangecomplete',
            postCompletedEventName : '',
			scrollOptions : {
				duration: 800,
				easing:'swing'
			},
			startAnim : function($oldContent, $newContent, url) { // Callback to be fired before new content is loaded. This function typically hides the old content, but you could keep it onscreen if you want. If keepOldContent is false, newContent will be an empty jQuery object.
				// Animating to opacity to 0 still keeps the element's height intact
				// Which prevents that annoying pop bang issue when loading in new content
				$oldContent.animate({opacity:0},800);
			},
			endAnim : function($oldContent, $newContent, url, completedEventName, data) { // Callback to be fired before new content is loaded. This function shows the new content. If keepOldContent is false, oldContent will be an empty jQuery object.
				$oldContent.remove();
				$newContent.css({ 'opacity' : 0, 'display' : 'block'}).animate({opacity:1},800);
				$('body').removeClass('ajaxify-loading');
				$(window).trigger(completedEventName, data);
			}, 
			keepOldContent : false // Should we keep the old content around so that endAnim can do stuff with it? If so, be sure to remove the old content in endAnim when you are done.
		}, options);
		if (settings.linkContainerSelector === '') {
			settings.linkContainerSelector = settings.contentSelector;
		}
		// Prepare internal variables
		var $content = $(settings.contentSelector).first(),
		contentNode = $content.get(0),
		$menu = $(settings.menuSelector),
		$window = $(window),
		$body = $(document.body),
		rootUrl = History.getRootUrl();

		// Ensure Content
		if ( $content.length === 0 ) {
			$content = $body;
		}

		// Internal Helper
		$.expr[':'].internal = function(obj, index, meta, stack){
			// Prepare
			var
				$this = $(obj),
				url = $this.attr('href')||'',
				isInternalLink;

			// Check link
			isInternalLink = url.substring(0,rootUrl.length) === rootUrl || url.indexOf(':') === -1;

			// Ignore or Keep
			return isInternalLink;
		};

		// HTML Helper
		var documentHtml = function(html){
			// Prepare
			var result = String(html)
				.replace(/<\!DOCTYPE[^>]*>/i, '')
				.replace(/<(html|head|body|title|meta|script)([\s\>])/gi,'<div class="document-$1"$2')
				.replace(/<\/(html|head|body|title|meta|script)\>/gi,'</div>')
			;

			// Return
			return $.trim(result);
		};

		// Ajaxify Helper
		function setupLinks($links){
			var linkSelector = ' a:internal:not(.no-ajaxy)',
				fullLinkSelector = settings.linkContainerSelector.replace(',', linkSelector + ',') + linkSelector;
            $($ajaxifyTarget).on("click", fullLinkSelector, function(event) {
                var
                    $links = $(this),
                    url = $links.attr('href'),
                    title = $links.attr('title')||null,
                    stateData = {
                        ajaxifyData : {
                            instance : JSON.stringify(settings),
                            referrer : unescape(document.location.toString())
                            //TODO: Make the instance ID a hash of settings, so that it's less data but still consistent across page loads (as opposed to a random number, which is short but not consistent).
                        }
                    };
                // Continue as normal for cmd clicks etc
                if ( event.which == 2 || event.metaKey ) { return true; }
                // Ajaxify this link
                History.pushState(stateData,title,url);
                event.preventDefault();
                return false;
            });

			// Chain
			return $links;
		}

		setupLinks($(settings.linkContainerSelector));

		// Hook into State Changes
		$window.bind('statechange',function() {

			// Prepare Variables
			var State = History.getState(),
				savedStates = History.savedStates,
				url = State.url,
				prevUrlIndex = savedStates.length - 2,
				prevUrl = savedStates[prevUrlIndex].url, // If this is the user's first time ajax loading something, this will be undefined.
				stateData = State.data,
				goingBack = false,
				prevPage,
				relativeUrl = url.replace(rootUrl,'');

			if (State.data.ajaxifyData) {
				if (stateData.ajaxifyData.instance !== JSON.stringify(settings)) {
					// Another AJAXIFY instance will handle this.
					return false;

				} else {
					// This instance of Ajaxify will handle.
					// TODO: we're getting to this point twice for each link clicked. Figure out why.
				}
				if (stateData.ajaxifyData.referrer !== prevUrl) {
					// User has gone back
					// TODO: Ajax load in this case
					document.location.href = url;
					return false;
				}
			} else {
				// This page wasn't loaded via Ajax
				document.location.href = url;
				return false;
			}

			// Set Loading
			$body.addClass('ajaxify-loading');

			// Page may have been changed since this instance of Ajaxify was first called, so update $content.
			$content = $(settings.contentSelector).first(),
			contentNode = $content.get(0);

			if (settings.keepOldContent) {
				$content
					.wrapInner('<div id="ajaxify-oldContent" />')
					.append('<div id="ajaxify-newContent" style="display: none;" />');
				settings.startAnim($('#ajaxify-oldContent'), $('#ajaxify-newContent'), url);
			} else {
				settings.startAnim($content, $(), url);
			}

			// Hide the existing content
			

			// Ajax Request the Traditional Page
			$.ajax({
				url: url,
				success: function(data, textStatus, jqXHR){
					// Prepare
					var
						$data = $(documentHtml(data)),
						$dataBody = $data.find('.document-body:first'),
						$dataContent = $dataBody.find(settings.contentSelector).filter(':first'),
						$menuChildren, contentHtml, $scripts;

					// Fetch the scripts
					$scripts = $dataContent.find('.document-script');
					if ( $scripts.length ) {
						$scripts.detach();
					}

					// Fetch the content
					contentHtml = $dataContent.html()||$data.html();
					if ( !contentHtml ) {
						document.location.href = url;
						return false;
					}

					// Update the menu
					$menuChildren = $menu.find(settings.menuChildrenSelector);
					$menuChildren.filter(settings.activeSelector).removeClass(settings.activeClass);
					$menuChildren = $menuChildren.has('a[href^="'+relativeUrl+'"],a[href^="/'+relativeUrl+'"],a[href^="'+url+'"]');
					if ( $menuChildren.length === 1 ) { $menuChildren.addClass(settings.activeClass); }

					// Update the content
					$content.stop(true,true);

					if (settings.keepOldContent) {
						$('#ajaxify-newContent').html(contentHtml);
					} else {
						$content.html(contentHtml);
					}

					// Update the title
					document.title = $data.find('.document-title:first').text();
					try {
						document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
					}
					catch ( Exception ) { }

					// Add the scripts
					$scripts.each(function(){
						var $script = $(this), scriptText = $script.text(), scriptNode = document.createElement('script');
						if ( $script.attr('src') ) {
							if ( !$script[0].async ) { scriptNode.async = false; }
							scriptNode.src = $script.attr('src');
						}
    						scriptNode.appendChild(document.createTextNode(scriptText));
						contentNode.appendChild(scriptNode);
					});

					// Complete the change
					if ( $body.ScrollTo||false ) { $body.ScrollTo(settings.scrollOptions); } /* http://balupton.com/projects/jquery-scrollto */
					

					// Inform Google Analytics of the change
					if ( typeof window._gaq !== 'undefined' ) {
						window._gaq.push(['_trackPageview', relativeUrl]);
					}

					// Inform ReInvigorate of a state change
					if ( typeof window.reinvigorate !== 'undefined' && typeof window.reinvigorate.ajax_track !== 'undefined' ) {
						reinvigorate.ajax_track(url);
						// ^ we use the full url here as that is what reinvigorate supports
					}

					if (settings.keepOldContent) {
						settings.endAnim($('#ajaxify-oldContent'), $('#ajaxify-newContent'), url, settings.completedEventName, data);
					} else {
						settings.endAnim($(), $content, url, settings.completedEventName, data);
					}
					
				},
				error: function(jqXHR, textStatus, errorThrown){
					document.location.href = url;
					return false;
				}
			}); // end ajax

		}); // end statechange
	}; // end $.fn.ajaxify
})( jQuery ); // end closure
