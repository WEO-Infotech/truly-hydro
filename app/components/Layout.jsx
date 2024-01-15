import { Await } from '@remix-run/react';
import { Suspense, useEffect, useRef } from 'react';
import { Aside } from '~/components/Aside';
import { Footer } from '~/components/Footer';
import { Header, HeaderMenu } from '~/components/Header';
import { CartMain } from '~/components/Cart';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';
import { Image } from '@shopify/hydrogen';

/**
 * @param {LayoutProps}
 */
export function Layout({ cart, children = null, footer, footer2, header, isLoggedIn }) {
  return (
    <>
      <CartAside cart={cart} />
      {/* <SearchAside /> */}
      <MobileMenuAside menu={header.menu} />
      <Header header={header} cart={cart} isLoggedIn={isLoggedIn} />
      <main>
        {/* <HeaderCounter /> */}
        {children}</main>
      <Suspense>
        <Await resolve={footer}>
          {(footer) => <Footer menu={footer.menu} menu2={footer2.menu} />}
        </Await>
      </Suspense>
    </>
  );
}

export function HeaderCounter() {
  // countdown script
  const dayRef = useRef(null)
  const hourRef = useRef(null)
  const minuteRef = useRef(null)
  const secondsRef = useRef(null)
  const dayValue = useRef(null)
  const hourValue = useRef(null)
  const minuteValue = useRef(null)
  const secondsValue = useRef(null)
  // Set Launch Date (ms)
  const launchDate = new Date("Mar 25, 2024 23:59:59 UTC-08:00").getTime();
  // End  Date
  const endDate = new Date().getTime();
  // Context object
  const c = {
    context: {},
    values: {},
    times: {}
  };

  // Convert radians to degrees
  function deg(d) {
    return (Math.PI / -180) * d - (Math.PI / 180) * 90;
  }

  function render() {
    c.context.seconds.clearRect(0, 0, 60, 60);
    c.context.seconds.beginPath();
    c.context.seconds.strokeStyle = "#fff";
    c.context.seconds.arc(30, 30, 28, deg(0), deg(6 * (60 - c.times.seconds)));
    c.context.seconds.lineWidth = 3;
    c.context.seconds.lineCap = "round";
    c.context.seconds.stroke();

    c.context.minutes.clearRect(0, 0, 60, 60);
    c.context.minutes.beginPath();
    c.context.minutes.strokeStyle = "#fff";
    c.context.minutes.arc(30, 30, 28, deg(0), deg(6 * (60 - c.times.minutes)));
    c.context.minutes.lineWidth = 3;
    c.context.minutes.lineCap = "round";
    c.context.minutes.stroke();

    c.context.hours.clearRect(0, 0, 60, 60);
    c.context.hours.beginPath();
    c.context.hours.strokeStyle = "#fff";
    c.context.hours.arc(30, 30, 28, deg(0), deg(15 * (24 - c.times.hours)));
    c.context.hours.lineWidth = 3;
    c.context.hours.lineCap = "round";
    c.context.hours.stroke();

    c.context.days.clearRect(0, 0, 60, 60);
    c.context.days.beginPath();
    c.context.days.strokeStyle = "#fff";
    c.context.days.arc(30, 30, 28, deg(0), deg(360 - c.times.days));
    c.context.days.lineWidth = 3;
    c.context.days.lineCap = "round";
    c.context.days.stroke();
  }

  function init() {
    if (dayRef.current && secondsRef.current && minuteRef.current && hourRef.current) {
      c.context.seconds = secondsRef.current.getContext('2d');
      c.context.minutes = minuteRef.current.getContext('2d');
      c.context.hours = hourRef.current.getContext('2d');
      c.context.days = dayRef.current.getContext('2d');
    }
    // Get 2D contexts

    // Get displayed values
    if (dayValue.current && secondsValue.current && minuteValue.current && hourValue.current) {
      c.values.seconds = secondsValue.current;
      c.values.minutes = minuteValue.current;
      c.values.hours = hourValue.current;
      c.values.days = dayValue.current;
    }

    if (endDate < launchDate) {
      var x = setInterval(function () {
        // Get todays date and time (ms)
        const now = new Date().getTime();

        // Get distance from now to launchDate
        const distance = launchDate - now;

        // Time calculations
        c.times.days = Math.floor(distance / (1000 * 60 * 60 * 24));
        c.times.hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        c.times.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        c.times.seconds = Math.floor((distance % (1000 * 60)) / 1000);

        c.values.days.innerText = c.times.days;
        c.values.hours.innerText = c.times.hours;
        c.values.minutes.innerText = c.times.minutes;
        c.values.seconds.innerText = c.times.seconds;

        if (distance < 0) {
          clearInterval(x);
          document.querySelector(".countdown-canvas").classList.add("time-expired");
        }

        render(); // Draw!
      }, 100);
    }

  }

  useEffect(() => {
    setTimeout(() => {
      init()
    }, 1000);
  }, [])

  return (
    <div className='countdown__wrapper'>
      <div className='container-fluid'>
        <div className='d-flex justify-content-center'>
          <div className=''>
            <a href='/pages/santa-hat' className='count__downCols'>
              <Image
                alt={""}
                aspectRatio="0"
                data={{ url: 'https://www.trulybeauty.com/cdn/shop/files/Dec-off7.jpg?v=1702271774' }}
                sizes="200vw"
                style={{ width: "auto" }}
              />
            </a>
          </div>
          <div className="countdown-canvas-outer">
            <div className="countdown-canvas count__canvasStyle">
              <div className="container-canvas days">
                <canvas ref={dayRef} width="60" height="60"></canvas>
                <svg width="60" height="60">
                  <circle id="outer" cx="30" cy="30" r="29" fill="transparent" strokeWidth="2" stroke="#ffffff" opacity="0.3"></circle>
                </svg>
                <div className="label">
                  <span ref={dayValue} className="count-value">380</span>
                  <span>days</span>
                </div>
              </div>

              <div className="container-canvas hours">
                <canvas ref={hourRef} width="60" height="60"></canvas>
                <svg width="60" height="60">
                  <circle id="outer" cx="30" cy="30" r="29" fill="transparent" strokeWidth="2" stroke="#ffffff" opacity="0.3"></circle>
                </svg>
                <div className="label">
                  <span ref={hourValue} className="count-value">23</span>
                  <span>hours</span>
                </div>
              </div>

              <div className="container-canvas minutes">
                <canvas ref={minuteRef} width="60" height="60"></canvas>
                <svg width="60" height="60">
                  <circle id="outer" cx="30" cy="30" r="29" fill="transparent" strokeWidth="2" stroke="#ffffff" opacity="0.3"></circle>
                </svg>
                <div className="label">
                  <span ref={minuteValue} className="count-value">29</span>
                  <span>minutes</span>
                </div>
              </div>

              <div className="container-canvas seconds">
                <canvas ref={secondsRef} width="60" height="60"></canvas>
                <svg width="60" height="60">
                  <circle id="outer" cx="30" cy="30" r="29" fill="transparent" strokeWidth="2" stroke="#ffffff" opacity="0.3"></circle>
                </svg>
                <div className="label">
                  <span ref={secondsValue} className="count-value">53</span>
                  <span>seconds</span>
                </div>
              </div>
            </div>
            <div className="count__downCntnt">
              <h4>Use Code</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{cart: LayoutProps['cart']}}
 */
function CartAside({ cart }) {
  const toggleCart = () => {
    window.location.hash = ""
    if (window.location.href.includes('#')) {
      const cleanedUrl = window.location.href.split('#')[0];
      window.history.replaceState(null, null, cleanedUrl);
    }
  }
  return (
    <Aside id="cart-aside" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} toggleCart={toggleCart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  return (
    <Aside id="search-aside" heading="SEARCH">
      <div className="predictive-search">
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
              <button type="submit">Search</button>
            </div>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
      </div>
    </Aside>
  );
}

/**
 * @param {{menu: HeaderQuery['menu']}}
 */
function MobileMenuAside({ menu }) {
  // const closeAside = () => {
  //   window.location.href = '';
  // }
  return (
    <Aside id="mobile-menu-aside" heading="">
      <div className='cart_overlay' onClick={() => history.go(-1)}></div>
      <HeaderMenu menu={menu} viewport="mobile" />
    </Aside>
  );
}

/**
 * @typedef {{
 *   cart: Promise<CartApiQueryFragment | null>;
 *   children?: React.ReactNode;
 *   footer: Promise<FooterQuery>;
 *   header: HeaderQuery;
 *   isLoggedIn: boolean;
 * }} LayoutProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
