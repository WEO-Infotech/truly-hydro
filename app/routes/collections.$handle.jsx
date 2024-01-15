import { json, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/utils';
import { ProductBlock, ProductRender, QuickView } from './_index';
import { useRef } from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';

/**
 * @type {V2_MetaFunction}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data.collection.title} Collection` }];
};

/**
 * @param {LoaderArgs}
 */
export async function loader({ request, params, context }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: { handle, ...paginationVariables },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  return json({ collection });
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const { collection } = useLoaderData();
  const swiperRef = useRef(null);
  const [showView, setshowView] = useState(false)
  const [activeSlide, setActiveSlide] = useState({})
  const [quickViewData, setQuickViewData] = useState({})

  function showQuickView(data) {
    document.body.classList.add("modal_open");
    setQuickViewData(data)
    setshowView(true)
    setActiveSlide(data?.images?.nodes[0])
    const customComponentRoot = document.createElement('div');
    customComponentRoot.classList.add("quickview_modal_outer")
    document.body.appendChild(customComponentRoot);
    return () => {
      document.body.removeChild(customComponentRoot);
    };
  }
  function closeModal() {
    document.body.classList.remove("modal_open");
    const childElement = document.querySelector('.quickview_modal_outer');
    if (childElement) {
      document.body.removeChild(childElement);
    }
    setQuickViewData({})
    setshowView(false)
  }


  const handleSlideChange = () => {
    if (swiperRef.current) {
      console.log('Active slide index:', swiperRef.current.swiper.realIndex);
      let index = swiperRef.current.swiper.realIndex
      if (index > -1) {
        setActiveSlide(quickViewData?.images?.nodes[index])
      }
    }
  };

  const handleThumbnailClick = (index) => {
    if (swiperRef.current) {
      if (index > -1) {
        console.log("swiperRef: ", swiperRef.current.swiper.slides[index])
        // swiperRef.current.swiper.slideTo(index);
        if (swiperRef.current.swiper.slides.length > 0) {
          swiperRef.current.swiper.slides.forEach(element => {
            element.classList.remove("swiper-slide-active")
          });
        }
        swiperRef.current.swiper.slides[index].classList.add("swiper-slide-active")
        setActiveSlide(quickViewData?.images?.nodes[index])
      }
    }
  }

  console.log("collection: ", collection)
  return (
    <div className="collection">
      <div className='collection_banner'>
        <Image
          alt={collection?.image?.altText}
          aspectRatio="0"
          data={collection?.image}
          sizes="200vw"
        />
      </div>
      <div className="commonSection">
        <div className="container-fluid">
          <div className="headingholder">
            {/* <h1>{collection.title}</h1> */}
          </div>
          {/* <p className="collection-description">{collection.description}</p> */}
          <Pagination connection={collection.products}>
            {({ nodes, isLoading, PreviousLink, NextLink }) => (
              <>
                {/* <PreviousLink>
                {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
              </PreviousLink> */}
                <ProductRender products={collection.products} showQuickView={showQuickView} />
                <br />
                <div className='text-center'>
                  <NextLink className='btn btn-primary'>
                    {isLoading ? 'Loading...' : <span>Load more</span>}
                  </NextLink>
                </div>
              </>
            )}
          </Pagination>
        </div>
      </div>

      {showView && ReactDOM.createPortal(
        <QuickView
          product={quickViewData}
          closeModal={closeModal}
          handleSlideChange={handleSlideChange}
          swiperRef={swiperRef}
          activeSlide={activeSlide}
          handleThumbnailClick={handleThumbnailClick}
        />,
        document.querySelector('.quickview_modal_outer')
      )}
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    images(first: 100) {
      nodes {
        id
        url
        altText
      }
    }
    variants(first: 1) {
      nodes {
        id
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        altText
      }
      products(
        first: 15
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @template T @typedef {import('@remix-run/react').V2_MetaFunction<T>} V2_MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
