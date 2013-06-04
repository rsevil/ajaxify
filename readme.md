# Ajaxify
Ajaxify your entire website instantly with this simple drop-in script using the HTML5 History API with History.js and jQuery ScrollTo.


## Installation

``` html
<!-- jQuery -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>

<!-- jQuery ScrollTo Plugin -->
<script src="//balupton.github.io/jquery-scrollto/scripts/jquery.scrollto.min.js"></script>

<!-- History.js -->
<script src="//browserstate.github.io/history.js/scripts/bundled/html4+html5/jquery.history.js"></script>

<!-- Ajaxify -->
<script src="//raw.github.com/browserstate/ajaxify/master/ajaxify-html5.js"></script>

<!-- Run Ajaxify -->
<script>
$(document).ready(function () {
	$.ajaxify();	
});
</script>
```

## Usage

The installation instructions above should get Ajaxify up and running. 

## Advanced Usage

By default, ajaxify looks for content in the most common places:

```css
main,#main,#content,article:first,.article:first,.post:first
```

Your content might actually be elsewhere. If so, just do something like this:

```javascript
$.ajaxify({
    contentSelector : '#myAwesomeContent'
});
```

By default, ajaxify works on all links in the page, but you can get more specific if you'd like:

```javascript
$.ajaxify({
    linkSelector : '#myAjaxNavigation'
});
```

You can get really fancy with this if you want. For example, you might want to set up Ajaxify so that when the user clicks a link in the sidebar, Ajaxify updates the content area but not the sidebar. To accomplish that, you could could do something like this:

``` javascript
$.ajaxify({
    contentSelector : '#main',
    linkContainerSelector '#sidebar'
});
```

Now clicking links in the sidebar will AJAX load the content area, but clicking links in the content area will trigger a normal, non-AJAX page load. You can have as many calls to ajaxify as you'd like.

## To Do

We've rewritten this fork of Ajaxify to work as a jQuery plugin that allows the user to have different AJAX behavior for different parts of the page. Some features are still underway. In particular:

* Write more complete documentation with examples of advanced use cases.
* Update code style so that it passes JSHint.
* Test the bookmarklet and fix as needed.

This plugin is in active development. API may change. Stuff is not guaranteed not to blow up. Consult your doctor before using Ajaxify.

## Bookmarklet

``` javascript
javascript:var%20e=document.createElement('script');e.setAttribute('src','//raw.github.com/browserstate/ajaxify/master/ajaxify-bookmarklet-helper.js');document.body.appendChild(e);void(0);
```

Inspired by by https://gist.github.com/balupton/919358.

## Explanation

### What do the installation instructions do?

1. Load in jQuery
1. Load in the [jQuery ScrollTo Plugin](https://github.com/balupton/jquery-scrollto) allowing our ajaxify gist to scroll nicely and smoothly to the new loaded in content
1. Load in [History.js](https://github.com/browserstate/history.js) with support for jQuery, HTML4 and HTML5
1. Load in this gist :-)

### What does this gist do?

1. Check if History.js is enabled for our current browser, if it isn't then skip this gist.

1. Create a way to detect our page's root url, so we can compare our links against it.

1. Create a way to convert the ajax repsonse into a format jQuery will understand - as jQuery is only made to handle elements which go inside the body element, not elements made for the head element.

1. Define our content and menu selectors, these are using when we load in new pages. We use our content selector to find our new content within the response, and replace the existing content on our current page. We use our menu selector to update the active navigation link in our menu when the page changes.

1. Discover our internal links on our website, and upgrade them so when they are clicked it instead of changing the page to the new page, it will change our page's state to the new page. Links with the class `no-ajaxy` will not be upgraded.

1. When a page state change occurs, we will:

	1. Determine the absolute and relative urls from the new url

	1. Use our content selector to find our current page's content and fade it out

	1. Send off an ajax request to the absolute url

	1. Convert the response into one we can undertand

	1. Extract the response's title and set `document.title` and the title element to it

	1. Use our menu selector to find our page's menu, then scan for new page's url in the menu, and make that the active menu item and mark other menu items inactive
	
	1. Finish the current content's fadeout animation

	1. Use our menu selector to find the new page's content, and replace the current content with the new page's content

	1. Fade the new content in

	1. Scroll to the new current content so the user is directed to the right place - rather than them ending up looking at the footer or something instead of your page's content due to the height shift with the content change

	1. Inform Google Analytics and other tracking software about the page change


## Using this Gist?

[Post your website in the showcase here!](https://github.com/browserstate/history.js/wiki/Showcase)

## Further Reading

- [The History.js Readme: Your guide to History.js](https://github.com/browserstate/history.js)
- [Intelligent State Handling: The evolution from hashes, to hashbangs to the HTML5 History API](https://github.com/browserstate/history.js/wiki/Intelligent-State-Handling)
- [The state of the HTML5 History API, why it isn't good enough and why we need History.js](https://github.com/browserstate/history.js/wiki/The-State-of-the-HTML5-History-API)

## History

- v1.0.1 - 30 September, 2012
	- Added completion event (customisable via `completedEventName` defaults to `statechangecomplete`)
	- Updated for new Google Analytics code - [credits to](https://gist.github.com/854622#gistcomment-294951) [aspiziri](https://github.com/aspiziri)

## License

Licensed under the [New BSD License](http://opensource.org/licenses/BSD-3-Clause)
