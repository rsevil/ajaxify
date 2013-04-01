// Ajaxify
// v1.0.1 - 30 September, 2012
// https://github.com/browserstate/ajaxify
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
			linkSelector : '',
			menuSelector : '#menu,#nav,nav:first,.nav:first',
			activeClass : 'active selected current youarehere',
			activeSelector : '.active,.selected,.current,.youarehere',
			menuChildrenSelector : '> li,> ul > li',
			completedEventName : 'statechangecomplete',
			scrollOptions : {
				duration: 800,
				easing:'swing'
			}
		}, options);
		if (settings.linkSelector === '') {
			settings.linkSelector = settings.contentSelector;
		}
		// Prepare internal variables
		var $content = $(settings.contentSelector).filter(':first'),
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
			return result;
		};

		// Ajaxify Helper
		function setupLinks($links){
			// Ajaxify
			$links.find('a:internal:not(.no-ajaxy)').click(function(event){
				// Prepare
				var
					$links = $(this),
					url = $links.attr('href'),
					title = $links.attr('title')||null;

				// Continue as normal for cmd clicks etc
				if ( event.which == 2 || event.metaKey ) { return true; }
				// Ajaxify this link
				History.pushState(null,title,url);
				event.preventDefault();
				return false;
			});

			// Chain
			return $links;
		};

		// Ajaxify our Internal Links
		setupLinks($ajaxifyTarget);

		// Hook into State Changes
		$window.bind('statechange',function(){
			// Prepare Variables
			var
				State = History.getState(),
				url = State.url,
				relativeUrl = url.replace(rootUrl,'');

			// Set Loading
			$body.addClass('loading');

			// Start Fade Out
			// Animating to opacity to 0 still keeps the element's height intact
			// Which prevents that annoying pop bang issue when loading in new content
			$content.animate({opacity:0},800);

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
					$content.html(contentHtml);
					setupLinks($content.filter(settings.linkSelector));
					$content.css('opacity',100).show(); /* you could fade in here if you'd like */

					// Update the title
					document.title = $data.find('.document-title:first').text();
					try {
						document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
					}
					catch ( Exception ) { }

					// Add the scripts
					$scripts.each(function(){
						var $script = $(this), scriptText = $script.text(), scriptNode = document.createElement('script');
						scriptNode.appendChild(document.createTextNode(scriptText));
						contentNode.appendChild(scriptNode);
					});

					// Complete the change
					if ( $body.ScrollTo||false ) { $body.ScrollTo(settings.scrollOptions); } /* http://balupton.com/projects/jquery-scrollto */
					$body.removeClass('loading');
					$window.trigger(settings.completedEventName);

					// Inform Google Analytics of the change
					if ( typeof window._gaq !== 'undefined' ) {
						window._gaq.push(['_trackPageview', relativeUrl]);
					}

					// Inform ReInvigorate of a state change
					if ( typeof window.reinvigorate !== 'undefined' && typeof window.reinvigorate.ajax_track !== 'undefined' ) {
						reinvigorate.ajax_track(url);
						// ^ we use the full url here as that is what reinvigorate supports
					}
				},
				error: function(jqXHR, textStatus, errorThrown){
					document.location.href = url;
					return false;
				}
			}); // end ajax

		}); // end onStateChange
	}; // end $.fn.ajaxify
})( jQuery ); // end closure
