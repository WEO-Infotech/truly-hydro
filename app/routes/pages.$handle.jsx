import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';

/**
 * @type {V2_MetaFunction}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data.page.title}` }];
};

/**
 * @param {LoaderArgs}
 */
export async function loader({ params, context }) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const { page } = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle: params.handle,
    },
  });

  if (!page) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ page });
}

export default function Page() {
  /** @type {LoaderReturnData} */
  const { page } = useLoaderData();

  return (
    <div className="page">
      <div className='commonSection'>
        <div className='container-fluid'>
          <header>
            <h1>{page.title}</h1>
          </header>
          <main dangerouslySetInnerHTML={{ __html: page.body }} />
        </div>
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @template T @typedef {import('@remix-run/react').V2_MetaFunction<T>} V2_MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
