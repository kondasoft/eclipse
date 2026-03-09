/*
  Theme copyright
*/
console.info('KS Eclipse theme by KondaSoft (https://kondasoft.com)');

/*
  External HTTP links
*/
function decorateHttpsLinks() {
  document.querySelectorAll('a[href*="https://"]').forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
}
decorateHttpsLinks();

/*
  Footer collapse state
*/
function initFooterCollapseState() {
  var mobileQuery = window.matchMedia('(max-width: 599px)');

  function syncFooterDetailsState(isMobile) {
    document.querySelectorAll('#footer .theme-collapse-details').forEach((details) => {
      if (isMobile) {
        details.removeAttribute('open');
        return;
      }

      details.setAttribute('open', '');
    });
  }

  syncFooterDetailsState(mobileQuery.matches);
  mobileQuery.addEventListener('change', (event) => {
    syncFooterDetailsState(event.matches);
  });
}
initFooterCollapseState();

/*
  Menu collapse state
*/
function initMenuCollapseState() {
  var menuDialog = document.getElementById('menu-dialog');

  if (!menuDialog) {
    return;
  }

  function getToggleTarget(button) {
    var linkGroup = button.closest('.nav-link-group');
    var target = null;

    if (!linkGroup || !(linkGroup.nextElementSibling instanceof HTMLElement)) {
      return null;
    }

    target = linkGroup.nextElementSibling;
    if (!target.classList.contains('nav-list-sub')) {
      return null;
    }

    return target;
  }

  function setExpanded(button, expanded) {
    var target = getToggleTarget(button);

    button.setAttribute('aria-expanded', String(expanded));
    if (target) {
      target.hidden = !expanded;
    }
  }

  function collapseItemAndDescendants(item) {
    item.querySelectorAll('[data-menu-toggle]').forEach((button) => {
      setExpanded(button, false);
    });
  }

  function handleMenuToggle(toggle) {
    var isExpanded = false;
    var currentItem = null;
    var parentList = null;

    currentItem = toggle.closest('.nav-item');
    parentList = currentItem ? currentItem.parentElement : null;
    if (!currentItem || !parentList) {
      return;
    }

    isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      collapseItemAndDescendants(currentItem);
      return;
    }

    for (var i = 0; i < parentList.children.length; i += 1) {
      var sibling = parentList.children[i];

      if (sibling === currentItem) {
        continue;
      }

      collapseItemAndDescendants(sibling);
    }

    setExpanded(toggle, true);
  }

  menuDialog.addEventListener('click', (event) => {
    var toggle = event.target.closest('[data-menu-toggle]');

    if (!toggle || !menuDialog.contains(toggle) || !getToggleTarget(toggle)) {
      return;
    }

    handleMenuToggle(toggle);
  });
}
initMenuCollapseState();

/*
  Sticky header
*/
function initStickyHeader() {
  const headerGroup = document.querySelector('#header-group');
  if (!headerGroup) {
    return;
  }

  headerGroup.classList.add("sticky");
  let lastScrollTop = 0;
  let ticking = false;

  function onScroll() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > lastScrollTop && currentScroll > headerGroup.clientHeight) {
        headerGroup.classList.add("hide");
      } else {
        headerGroup.classList.remove("hide");
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}
initStickyHeader();

/*
  Media (Video/Iframe/Model) on view
*/
function initMediaOnView() {
  var videos = document.querySelectorAll('video');
  var iframes = document.querySelectorAll('iframe[data-src]');
  var models = document.querySelectorAll('model-viewer[data-src]');
  var mediaItems = [];

  if (!videos.length && !iframes.length && !models.length) {
    return;
  }

  function isDataAutoplayEnabled(video) {
    if (!video.hasAttribute('data-autoplay')) {
      return false;
    }

    if (video.dataset.autoplay === 'false') {
      return false;
    }

    return true;
  }

  function activateVideo(video) {
    if (video.dataset.poster && !video.poster) {
      video.poster = video.dataset.poster;
    }

    if (!isDataAutoplayEnabled(video)) {
      return;
    }

    video.preload = 'auto';
    video.play().catch(function () {
      // Ignore autoplay failures caused by browser policies.
    });
  }

  function activateIframe(iframe) {
    if (iframe.dataset.src && !iframe.getAttribute('src')) {
      iframe.setAttribute('src', iframe.dataset.src);
    }
  }

  function activateModel(model) {
    if (model.dataset.src && !model.getAttribute('src')) {
      model.setAttribute('src', model.dataset.src);
    }
  }

  mediaItems = mediaItems.concat(Array.prototype.slice.call(videos));
  mediaItems = mediaItems.concat(Array.prototype.slice.call(iframes));
  mediaItems = mediaItems.concat(Array.prototype.slice.call(models));

  if (!('IntersectionObserver' in window)) {
    mediaItems.forEach((media) => {
      if (media.tagName === 'VIDEO') {
        activateVideo(media);
        return;
      }

      if (media.tagName === 'IFRAME') {
        activateIframe(media);
        return;
      }

      if (media.tagName === 'MODEL-VIEWER') {
        activateModel(media);
      }
    });
    return;
  }

  var observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      if (entry.target.tagName === 'VIDEO') {
        activateVideo(entry.target);
      } else if (entry.target.tagName === 'IFRAME') {
        activateIframe(entry.target);
      } else if (entry.target.tagName === 'MODEL-VIEWER') {
        activateModel(entry.target);
      }
      instance.unobserve(entry.target);
    });
  }, {
    threshold: 0,
    rootMargin: '300px 0px 0px 0px'
  });

  mediaItems.forEach((media) => {
    observer.observe(media);
  });
}

initMediaOnView();


/*
  SVG inline utility
*/
async function inlineSvgImages() {
  var root = document;
  var selector = 'img[data-transform-svg-inline]';
  var forceCurrentColor = true;
  var preserveFillNone = true;
  var credentials = 'same-origin';
  var images = [];

  if (!root || typeof root.querySelectorAll !== 'function') {
    return [];
  }

  images = Array.from(root.querySelectorAll(selector));

  return Promise.all(
    images.map(async (img) => {
      var source = img.currentSrc || img.getAttribute('src') || '';
      var normalizedSource = source.split('?')[0].toLowerCase();
      var width = null;
      var height = null;
      var className = null;
      var id = null;
      var style = null;
      var alt = null;
      var response = null;
      var markup = null;
      var svgDocument = null;
      var svg = null;

      if (img.dataset.inlineSvgProcessed === 'true' || !normalizedSource.endsWith('.svg')) {
        return null;
      }

      try {
        response = await fetch(source, { credentials });
        if (!response.ok) {
          return null;
        }

        markup = await response.text();
        svgDocument = new DOMParser().parseFromString(markup, 'image/svg+xml');
        svg = svgDocument.querySelector('svg');
        if (!svg) {
          return null;
        }

        width = img.getAttribute('width');
        height = img.getAttribute('height');
        className = img.getAttribute('class');
        id = img.getAttribute('id');
        style = img.getAttribute('style');
        alt = img.getAttribute('alt');

        if (width) {
          svg.setAttribute('width', width);
        }
        if (height) {
          svg.setAttribute('height', height);
        }
        if (className) {
          svg.setAttribute('class', className);
        }
        if (id) {
          svg.setAttribute('id', id);
        }
        if (style) {
          svg.setAttribute('style', style);
        }

        if (alt) {
          svg.setAttribute('role', 'img');
          svg.setAttribute('aria-label', alt);
        } else {
          svg.setAttribute('aria-hidden', 'true');
        }

        if (forceCurrentColor) {
          svg.setAttribute('fill', 'currentColor');
          Array.from(svg.querySelectorAll('[fill]')).forEach((element) => {
            var fillValue = (element.getAttribute('fill') || '').trim().toLowerCase();
            if (fillValue && (!preserveFillNone || fillValue !== 'none')) {
              element.setAttribute('fill', 'currentColor');
            }
          });
        }

        img.dataset.inlineSvgProcessed = 'true';
        img.replaceWith(svg);
        return svg;
      } catch (error) {
        return null;
      }
    })
  );
}
inlineSvgImages()
window.addEventListener('shopify:section:load', inlineSvgImages);
