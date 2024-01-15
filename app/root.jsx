import { useNonce } from '@shopify/hydrogen';
import { defer } from '@shopify/remix-oxygen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useCatch,
  LiveReload,
  useMatches,
  useRouteError,
  useLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
} from '@remix-run/react';
import favicon from '../public/favicon.svg';
import slickStyle from "slick-carousel/slick/slick.css";
import slickStyle2 from "slick-carousel/slick/slick-theme.css";
import swiperStyle from 'swiper/css';
import bootstrapStyle from 'bootstrap/dist/css/bootstrap.min.css';
import resetStyles from './styles/reset.css';
import gridStyles from './styles/grid.css';
import allStyles from './styles/style.css';
import responsiveStyles from './styles/responsive.css';
import appStyles from './styles/app.css';
import { Layout } from '~/components/Layout';
import lightgallery from 'lightgallery/css/lightgallery.css';
import lightgalleryZoom from 'lightgallery/css/lg-zoom.css';
import { useEffect } from 'react';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({ formMethod, currentUrl, nextUrl }) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

export function links() {
  return [
    { rel: 'stylesheet', href: slickStyle },
    { rel: 'stylesheet', href: slickStyle2 },
    { rel: 'stylesheet', href: swiperStyle },
    { rel: 'stylesheet', href: lightgallery },
    { rel: 'stylesheet', href: lightgalleryZoom },
    { rel: 'stylesheet', href: bootstrapStyle },
    { rel: 'stylesheet', href: gridStyles },
    { rel: 'stylesheet', href: appStyles },
    { rel: 'stylesheet', href: resetStyles },
    { rel: 'stylesheet', href: allStyles },
    { rel: 'stylesheet', href: responsiveStyles },
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    { rel: 'icon', type: 'image/svg+xml', href: favicon },
  ];
}

/**
 * @param {LoaderArgs}
 */
export async function loader({ context }) {
  const { storefront, session, cart } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  const publicStoreDomain = context.env.PUBLIC_STORE_DOMAIN;

  // validate the customer access token is valid
  const { isLoggedIn, headers } = await validateCustomerAccessToken(
    session,
    customerAccessToken,
  );

  // defer the cart query by not awaiting it
  const cartPromise = cart.get();

  // defer the footer query (below the fold)
  const footerPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'account', // Adjust to your footer menu handle
    },
  });
  const footerPromise2 = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'discover', // Adjust to your footer menu handle
    },
  });

  // await the header query (above the fold)
  const headerPromise = storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      headerMenuHandle: 'desktop-menu', // Adjust to your header menu handle
    },
  });

  return defer(
    {
      cart: cartPromise,
      footer: await footerPromise,
      footer2: await footerPromise2,
      header: await headerPromise,
      isLoggedIn,
      publicStoreDomain,
    },
    { headers },
  );
}

export default function App() {
  const nonce = useNonce();
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  console.log("App data: ", data)

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn2.stamped.io/files/widget.min.js';
    script.setAttribute('data-api-key', "pubkey-y0bQR825X6K52BT67V84qf3OGso3o0");
    script.setAttribute('id', "stamped-script-widget");
    script.defer = true;
    document.head.appendChild(script);

    setTimeout(() => {
      console.log("window.StampedFn: ", StampedFn)
      if (StampedFn) {
        StampedFn.init({ apiKey: "pubkey-y0bQR825X6K52BT67V84qf3OGso3o0", storeUrl: "trulyorganic.myshopify.com" })
      }
    }, 1000);
    return () => {
      // Clean up if needed (e.g., removing the script from the DOM)
      // document.head.removeChild(script);
    };
  }, [])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />

      </head>
      <body>
        <Layout {...data}>
          <Outlet />
        </Layout>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const [root] = useMatches();
  const nonce = useNonce();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout {...root.data}>
          <div className="route-error">
            <h1>Oops</h1>
            <h2>{errorStatus}</h2>
            {errorMessage && (
              <fieldset>
                <pre>{errorMessage}</pre>
              </fieldset>
            )}
          </div>
        </Layout>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

/**
 * @param {{error: Error}}
 */
export const ErrorBoundaryV1 = ({ error }) => {
  // eslint-disable-next-line no-console
  console.error(error);

  return <div>There was an error.</div>;
};

export function CatchBoundary() {
  const caught = useCatch();
  // eslint-disable-next-line no-console
  console.error(caught);

  return (
    <div>
      There was an error. Status: {caught.status}. Message:{' '}
      {caught.data?.message}
    </div>
  );
}

/**
 * Validates the customer access token and returns a boolean and headers
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CustomerAccessToken
 *
 * @example
 * ```js
 * const {isLoggedIn, headers} = await validateCustomerAccessToken(
 *  customerAccessToken,
 *  session,
 * );
 * ```
 * @param {HydrogenSession} session
 * @param {CustomerAccessToken} [customerAccessToken]
 */
async function validateCustomerAccessToken(session, customerAccessToken) {
  let isLoggedIn = false;
  const headers = new Headers();
  if (!customerAccessToken?.accessToken || !customerAccessToken?.expiresAt) {
    return { isLoggedIn, headers };
  }

  const expiresAt = new Date(customerAccessToken.expiresAt).getTime();
  const dateNow = Date.now();
  const customerAccessTokenExpired = expiresAt < dateNow;

  if (customerAccessTokenExpired) {
    session.unset('customerAccessToken');
    headers.append('Set-Cookie', await session.commit());
  } else {
    isLoggedIn = true;
  }

  return { isLoggedIn, headers };
}

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
`;

const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;

const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @typedef {import('@remix-run/react').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').CustomerAccessToken} CustomerAccessToken */
/** @typedef {import('../server').HydrogenSession} HydrogenSession */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
