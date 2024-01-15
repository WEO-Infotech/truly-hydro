import { Await, NavLink, useMatches } from '@remix-run/react';
import { Suspense, useState } from 'react';
import Images from "./images";
import { PredictiveSearchForm, PredictiveSearchResults } from './Search';
import { CartMain } from './Cart';
import { Image } from '@shopify/hydrogen';

/**
 * @param {HeaderProps}
 */
export function Header({ header, isLoggedIn, cart }) {
  const { shop, menu } = header;
  const [showSearch, setShowSearch] = useState(false)
  const toggleSearch = () => {
    setShowSearch(!showSearch)
  }
  return (
    <header className='truly_header'>
      <div className='container-fluid'>
        <div className='main_header'>
          <a className='noStyle truly_toggle' href="#mobile-menu-aside">
            <span></span>
            <span></span>
            <span></span>
          </a>
          <div className='truly_logo'>
            <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
              <strong>
                <img src={Images?.logo} width="150" alt={shop.name} /></strong>
            </NavLink>
          </div>
          <div className='truly_navbar'>
            <HeaderMenu menu={menu} viewport="desktop" />
          </div>
          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} toggleSearch={toggleSearch} />
        </div>
      </div>
      {showSearch ?
        <HeaderSearch toggleSearch={toggleSearch} />
        : null
      }
    </header>
  );
}


/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   viewport: Viewport;
 * }}
 */
export function HeaderMenu({ menu, viewport }) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;
  const className = `header-menu-${viewport}`;
  const [active, setActive] = useState("")

  function closeAside(event) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }
  function handleToggle(id) {
    setActive(active == id ? "" : id)
  }

  return (
    <ul className='header_mobile_menu'>
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={closeAside}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <li key={item.id} className={`${item.items.length > 0 ? "has-dropdown" : ""} ${active == item.id ? "active" : ""}`}>
            <NavLink
              className="header-menu-item"
              end
              onClick={closeAside}
              prefetch="intent"
              style={activeLinkStyle}
              to={url}
            >
              {item.title}
            </NavLink>
            {item.items.length > 0 ?
              <>
                {viewport === 'mobile' ?
                  <button className='noStyle dropdown-caret' onClick={() => handleToggle(item.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="9.334" height="17.334" viewBox="0 0 9.334 17.334">
                      <path d="M4.695,1.695a.667.667,0,0,1,.944,0l8,8a.667.667,0,0,1,0,.944l-8,8a.668.668,0,1,1-.944-.944l7.529-7.528L4.695,2.639a.667.667,0,0,1,0-.944Z" transform="translate(-4.5 -1.5)" fill="currentColor" fillRule="evenodd"></path>
                    </svg>
                  </button>
                  : null
                }
                <ul>
                  {item.items.map((opt, i) => {
                    const url2 =
                      opt.url.includes('myshopify.com') ||
                        opt.url.includes(publicStoreDomain)
                        ? new URL(opt.url).pathname
                        : opt.url;
                    return (
                      <li key={opt.id}>
                        <NavLink
                          className="header-menu-item"
                          end
                          onClick={closeAside}
                          prefetch="intent"
                          style={activeLinkStyle}
                          to={url2}
                        >
                          {opt.title}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </>
              : null
            }
          </li>
        );
      })}
    </ul>
  );
}

function HeaderSearch(props) {
  return (
    <div className="predictive-search">
      <div className="container-fluid">
        <PredictiveSearchForm>
          {({ fetchResults, inputRef }) => (
            <div className='d-flex'>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                className='form-control'
              />
              &nbsp;
              <button className='noStyle ps-3' onClick={props.toggleSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 10.667 10.667">
                  <path fill="currentColor" d="M4.723,4.723a.762.762,0,0,1,1.079,0L9.833,8.756l4.031-4.033A.763.763,0,1,1,14.942,5.8L10.91,9.833l4.033,4.031a.763.763,0,1,1-1.079,1.079L9.833,10.91,5.8,14.942a.763.763,0,1,1-1.079-1.079L8.756,9.833,4.723,5.8a.762.762,0,0,1,0-1.079Z" transform="translate(-4.499 -4.499)"></path>
                </svg>
              </button>
            </div>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
      </div>
    </div>
  )
}

function HeaderCart(props) {
  return (
    <Suspense fallback={<p>Loading cart ...</p>}>
      <Await resolve={props.cart}>
        {(cart) => {
          return <CartMain cart={cart} toggleCart={props.toggleCart} />;
        }}
      </Await>
    </Suspense>
  )
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({ isLoggedIn, cart, toggleSearch, toggleCart }) {
  return (
    <div className="truly_header_links">
      <div className="navAccount search--icon">
        <SearchToggle toggleSearch={toggleSearch} />
      </div>
      <div className="navAccount user--icon">
        <NavLink prefetch="intent" to="/account">
          <img src={Images?.user} alt="user" />
        </NavLink>
      </div>
      <div className="navAccount cart--icon">
        <CartToggle cart={cart} />
      </div>

      {/* <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        {isLoggedIn ? 'Account' : 'Sign in'}
      </NavLink> */}
    </div>
  );
}

function HeaderMenuMobileToggle() {
  return (
    <a className="header-menu-mobile-toggle" href="#mobile-menu-aside">
      <h3>☰</h3>
    </a>
  );
}

function SearchToggle(props) {
  return <button className='noStyle' onClick={props.toggleSearch}><img src={Images.search} alt="search" width={15} /></button>;
}

/**
 * @param {{count: number}}
*/
function CartBadge(props) {
  // return <button className='noStyle header_cart_icon' onClick={props.toggleCart}><img src={Images.cart} alt="search" width={15} /><strong className='cartItemCounter'>{props.count}</strong></button>;
  return <a href="#cart-aside">
    <img src={Images.cart} alt="cart" width={15} /> <strong className='cartItemCounter'>{props.count}</strong>
  </a>;
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle(props) {
  return (
    <Suspense fallback={<CartBadge count={0} toggleCart={props.toggleCart} />}>
      <Await resolve={props.cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} toggleCart={props.toggleCart} />;
          return <CartBadge count={cart.totalQuantity || 0} toggleCart={props.toggleCart} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({ isActive, isPending }) {
  return {
    // fontWeight: isActive ? 'bold' : undefined,
    // color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>} HeaderProps */
/** @typedef {'desktop' | 'mobile'} Viewport */

/** @typedef {import('./Layout').LayoutProps} LayoutProps */
