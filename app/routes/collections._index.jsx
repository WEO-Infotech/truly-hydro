import { useLoaderData, Link } from '@remix-run/react';
import { json } from '@shopify/remix-oxygen';
import { Pagination, getPaginationVariables, Image } from '@shopify/hydrogen';

/**
 * @param {LoaderArgs}
 */
export async function loader({ context, request }) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const { collections } = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return json({ collections });
}

export default function Collections() {
  /** @type {LoaderReturnData} */
  const { collections } = useLoaderData();

  return (
    <div className="commonSection collections">
      <div className="container-fluid">
        <h1>Collections</h1>
        <Pagination connection={collections}>
          {({ nodes, isLoading, PreviousLink, NextLink }) => (
            <div>
              {/* <PreviousLink>
                {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
              </PreviousLink> */}
              <CollectionsGrid collections={nodes} />
              <div className='text-center'>
                <NextLink className='btn btn-primary'>
                  {isLoading ? 'Loading...' : <span>Load more</span>}
                </NextLink>
              </div>
            </div>
          )}
        </Pagination>
      </div>
    </div>
  );
}

/**
 * @param {{collections: CollectionFragment[]}}
 */
function CollectionsGrid({ collections }) {
  return (
    <div className="collections-grid">
      <div className="row">
        {collections.filter((x) => x.image).map((collection, index) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   collection: CollectionFragment;
 *   index: number;
 * }}
 */
function CollectionItem({ collection, index }) {
  return (
    <div className='col-sm-6 col-md-4 col-xl-20' key={collection.id}>
      <Link
        className="collection-item"
        to={`/collections/${collection.handle}`}
        prefetch="intent"
      >
        {collection?.image && (
          <div className='collection_block_image img-zoom'>
            <Image
              alt={collection.image.altText || collection.title}
              aspectRatio="1/1"
              sizes="200vw"
              data={collection.image}
              loading={index < 3 ? 'eager' : undefined}
            />
          </div>
        )}
        <h5>{collection.title}</h5>
      </Link>
    </div>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @typedef {import('storefrontapi.generated').CollectionFragment} CollectionFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
