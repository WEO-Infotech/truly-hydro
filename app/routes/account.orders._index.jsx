import { Link, useLoaderData } from '@remix-run/react';
import { Image, Money, Pagination, getPaginationVariables } from '@shopify/hydrogen';
import { json, redirect } from '@shopify/remix-oxygen';
import images from '~/components/images';

/**
 * @type {V2_MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Orders' }];
};

/**
 * @param {LoaderArgs}
 */
export async function loader({ request, context }) {
  const { session, storefront } = context;

  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken?.accessToken) {
    return redirect('/account/login');
  }

  try {
    const paginationVariables = getPaginationVariables(request, {
      pageBy: 20,
    });

    const { customer } = await storefront.query(CUSTOMER_ORDERS_QUERY, {
      variables: {
        customerAccessToken: customerAccessToken.accessToken,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        ...paginationVariables,
      },
      cache: storefront.CacheNone(),
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return json({ customer });
  } catch (error) {
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 400 });
    }
    return json({ error }, { status: 400 });
  }
}

export default function Orders() {
  /** @type {LoaderReturnData} */
  const { customer } = useLoaderData();
  const { orders, numberOfOrders } = customer;
  return (
    <div className="orders">
      <h2>
        My Orders <small>({numberOfOrders})</small>
      </h2>
      <br />
      {orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

/**
 * @param {Pick<CustomerOrdersFragment, 'orders'>}
 */
function OrdersTable({ orders }) {
  return (
    <div className="acccount-orders">
      {orders?.nodes.length ? (
        <Pagination connection={orders}>
          {({ nodes, isLoading, PreviousLink, NextLink }) => {
            return (
              <>
                {/* <PreviousLink>
                  {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                </PreviousLink> */}
                <div className='row'>
                  {nodes.map((order) => {
                    return <OrderItem key={order.id} order={order} />;
                  })}
                </div>
                <div className='text-center mt-3'>
                  <NextLink className='btn btn-primary'>
                    {isLoading ? 'Loading...' : <span>Load more</span>}
                  </NextLink>
                </div>
              </>
            );
          }}
        </Pagination>
      ) : (
        <EmptyOrders />
      )}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div>
      <p>You haven&apos;t placed any orders yet.</p>
      <br />
      <p>
        <Link to="/collections">Start Shopping →</Link>
      </p>
    </div>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({ order }) {
  console.log("order: ", order);
  return (
    <>
      <fieldset className='col-sm-6 col-md-4 mb-4'>
        <div className='account_orders'>

          <div className='order_detail_header'>
            <div className='order_detail_left'>
              <p><strong>{order.financialStatus}</strong> <small>({order.fulfillmentStatus})</small></p>
              <Money data={order.currentTotalPrice} as={"strong"} className='mb-0' />
            </div>

            <div className='order_detail_right text-end'>
              <p>
                {/* <Link to={`/account/orders/${order.id}`}> */}
                  <strong>Order No. #{order.orderNumber}</strong>
                {/* </Link> */}
                <p className='mb-0'><small>{new Date(order.processedAt).toDateString()}</small></p>
              </p>
            </div>
          </div>
          <hr />
          <div className='row'>
            <div className='col-md-8'>
              {order.lineItems.nodes.length > 0 && order.lineItems.nodes.map((opt, i) => {
                let img = opt?.variant?.image
                return (
                  <div className='order_line_items' key={i}>
                    {/* {img ?
                      <Image
                        alt={opt?.variant?.image.altText || ''}
                        aspectRatio="0"
                        data={img}
                        sizes="200vw"
                        style={{ width: 80 }}
                      />
                      :
                      <img src={images.logo} alt="Truly" width={80} />
                    } */}
                    <div className=''>
                      <p><small>{opt?.title}</small></p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className='col-md-4 text-end'>
              <p>
                <Link className='btn btn-sm btn-primary px-3' to={`/account/orders/${btoa(order.id)}`}>Order Details</Link>
              </p>
            </div>
          </div>

        </div>
      </fieldset>
      <br />
    </>
  );
}

const ORDER_ITEM_FRAGMENT = `#graphql
  fragment OrderItem on Order {
    currentTotalPrice {
      amount
      currencyCode
    }
    financialStatus
    fulfillmentStatus
    id
    lineItems(first: 10) {
      nodes {
        title
        variant {
          image {
            url
            altText
            height
            width
          }
        }
      }
    }
    orderNumber
    customerUrl
    statusUrl
    processedAt
  }
`;

export const CUSTOMER_FRAGMENT = `#graphql
  fragment CustomerOrders on Customer {
    numberOfOrders
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...OrderItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/customer
const CUSTOMER_ORDERS_QUERY = `#graphql
  ${CUSTOMER_FRAGMENT}
  query CustomerOrders(
    $country: CountryCode
    $customerAccessToken: String!
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      ...CustomerOrders
    }
  }
`;

/** @template T @typedef {import('@remix-run/react').V2_MetaFunction<T>} V2_MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @typedef {import('storefrontapi.generated').CustomerOrdersFragment} CustomerOrdersFragment */
/** @typedef {import('storefrontapi.generated').OrderItemFragment} OrderItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
