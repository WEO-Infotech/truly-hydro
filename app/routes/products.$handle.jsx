import { Suspense, useEffect } from 'react';
import { defer, redirect } from '@shopify/remix-oxygen';
import { Await, Link, useLoaderData, useLocation } from '@remix-run/react';

import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';
import { getVariantUrl } from '~/utils';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel } from 'swiper/modules';
import { useRef } from 'react';
import { useState } from 'react';
import LightGallery from 'lightgallery/react';
import { Modal } from "react-bootstrap"

import lgZoom from 'lightgallery/plugins/zoom';

/**
 * @type {V2_MetaFunction}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data.product.title}` }];
};

/**
 * @param {LoaderArgs}
 */
export async function loader({ params, request, context }) {
  const { handle } = params;
  const { storefront } = context;

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle, selectedOptions },
  });

  if (!product?.id) {
    throw new Response(null, { status: 404 });
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      return redirectToFirstVariant({ product, request });
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: { handle },
  });

  return defer({ product, variants });
}

/**
 * @param {{
 *   product: ProductFragment;
 *   request: Request;
 * }}
 */
function redirectToFirstVariant({ product, request }) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  throw redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export function Stamped({ type, product, location }) {
  useEffect(() => {
    // // Load Stamped.io widget script
    // const script = document.createElement('script');
    // script.src = 'https://cdn2.stamped.io/files/widget.min.js';
    // script.setAttribute('data-api-key', "pubkey-y0bQR825X6K52BT67V84qf3OGso3o0");
    // script.setAttribute('id', "stamped-script-widget");
    // script.defer = true;
    // document.head.appendChild(script);
    // return () => {
    //   // Clean up if needed (e.g., removing the script from the DOM)
    //   document.head.removeChild(script);
    // };
  }, []);

  return (
    <div>
      {type == "main" ?
        <div id="stamped-main-widget"
          data-widget-style="standard"
          data-product-id={product?.id && product?.id.split("/Product/")[1]}
          data-name={product?.title || ""}
          data-url={`https://www.trulybeauty.com${location?.pathname}`}
          data-image-url={product?.images?.nodes[0]?.url}
          data-description={product.descriptionHtml || ""}
          data-product-sku={product.handle}
          data-product-type={product.productType}
          data-offset="200"
          data-widget-type="full-page">
        </div>
        :
        // <a href={`${location.pathname}/#review-single`}>
        <span
          className="stamped-product-reviews-badge"
          data-product-sku={product?.handle}
          data-id={product?.id && product?.id.split("/Product/")[1]}
          data-product-title={product?.title || ""}
          data-product-type={product.productType}
        ></span>
        // </a>
      }
    </div>
  )
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const { product, variants } = useLoaderData();
  console.log("selected product: ", product);
  const { selectedVariant } = product;
  const videoRef = useRef()
  const swiperRef = useRef(null);
  const swiperRef2 = useRef(null);
  const location = useLocation()
  const [activeSlide, setActiveSlide] = useState(product?.images?.nodes[0] || {})
  const [metaFields, setmetaFields] = useState({})
  const [videoPlay, setvideoPlay] = useState("")

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const showPopup = () => setShow(true);

  const [quantity, setQuantity] = useState(1)
  const handleQty = (type) => {
    if (type == "inc") {
      setQuantity(parseInt(quantity + 1))
    } else {
      if (quantity > 0) {
        setQuantity(parseInt(quantity - 1))
      }
    }
  }
  const handleQtyChange = (e) => {
    setQuantity(parseInt(e.target.value))
  }

  useEffect(() => {
    let newObj = {}
    product.metafields.length > 0 && product.metafields.map((opt) => {
      if (opt) {
        newObj[opt.key] = opt.value
      }
    })
    console.log("newObj: ", newObj)
    setmetaFields(newObj)
  }, [])

  const handleSlideChange = () => {
    if (swiperRef.current) {
      let index = swiperRef.current.swiper.realIndex
      if (index > -1) {
        setActiveSlide(product?.images?.nodes[index])
      }
    }
  };

  const handleSlideChange2 = () => {
    if (swiperRef2.current) {
      console.log("swiperRef2.current: ", swiperRef2.current)
    }
  };

  const handleThumbnailClick = (index) => {
    if (swiperRef.current) {
      if (index > -1) {
        if (swiperRef.current.swiper.slides.length > 0) {
          swiperRef.current.swiper.slides.forEach(element => {
            element.classList.remove("swiper-slide-active")
          });
        }
        swiperRef.current.swiper.slides[index].classList.add("swiper-slide-active")
        setActiveSlide(product?.images?.nodes[index])
      }
    }
  }

  useEffect(() => {
    document.body.classList.remove("modal_open");
  }, [location.pathname])

  const onBeforeSlide = (detail) => {
    const { index, prevIndex } = detail;
    console.log(index, prevIndex);
  };
  const onAfterClose = () => {
    document.body.classList.remove("modal_open");
  };
  const onAfterOpen = () => {
    onSlideItemLoad()
  }

  const onSlideItemLoad = () => {
    setTimeout(() => {
      document.body.classList.add("modal_open");
    }, 200);
  }

  const playVideo = () => {
    setvideoPlay(!videoPlay)
  }

  const handleVideoEnded = () => {
    setvideoPlay("")
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  // const [saveOption, setSaveOption] = useState(product?.sellingPlanGroups?.edges[0]?.node?.options[0]?.values[0] || "")
  const [saveOption, setSaveOption] = useState(product?.sellingPlanGroups?.edges[0]?.node?.sellingPlans?.edges[0]?.node?.id || "")
  const handleOptionChange = (e) => {
    setSaveOption(e.target.value)
  }

  useEffect(() => {
    if (videoRef && videoRef.current) {
      console.log("videoref", videoRef)
      if (videoPlay) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [videoPlay])
  console.log("saveOption: ", saveOption)

  useEffect(() => {
    setTimeout(() => {
      console.log("window.StampedFn: ", StampedFn)
      if (StampedFn) {
        StampedFn.init({ apiKey: "pubkey-y0bQR825X6K52BT67V84qf3OGso3o0", storeUrl: "trulyorganic.myshopify.com" })
      }

      StampedFn.reloadUGC();
    }, 1000);
  }, [])

  return (
    <div className="commonSection product-page">
      <div className="container-fluid">
        <div className="row gx-5">
          <div className="col-lg-6 col-md-6">
            <div className='product_detail_images'>
              <div className='product_detail_single_image'>
                <LightGallery
                  elementClassNames="custom-wrapper-class"
                  onBeforeSlide={onBeforeSlide}
                  onAfterClose={onAfterClose}
                  onAfterOpen={onAfterOpen}
                  // onSlideItemLoad={onSlideItemLoad}
                  plugins={[lgZoom]}
                  download={false}
                  infiniteZoom={false}
                  hideScrollbar={true}
                >

                  <a data-src={activeSlide?.url} className='product_slides activeSlide' style={{ cursor: "crosshair" }}>
                    <Image
                      alt={activeSlide.altText || ''}
                      aspectRatio="0"
                      data={activeSlide}
                      sizes="200vw"
                    />
                  </a>
                  {product?.images?.nodes.filter((x) => x?.id !== activeSlide?.id).map((img, i) => {
                    return (
                      <a data-src={img?.url} key={i + 1} className='product_slides'>
                        <Image
                          alt={img.altText || ''}
                          aspectRatio="0"
                          data={img}
                          sizes="200vw"
                        />
                      </a>
                    )
                  })}
                </LightGallery>
              </div>
              <div className='product_image_thumb'>
                <Swiper
                  spaceBetween={0}
                  slidesPerView={3}
                  mousewheel={true}
                  direction={'vertical'}
                  onSlideChange={handleSlideChange}
                  autoHeight={true}
                  navigation={true, {
                    nextEl: '.custom-next-arrow',
                    prevEl: '.custom-prev-arrow',
                  }}
                  modules={[Mousewheel, Navigation]}
                  ref={swiperRef}
                  onSwiper={(swiper) => console.log("swiper", swiper)}
                >
                  <div className="custom_arrows custom-prev-arrow">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.29289 9.29289C4.90237 9.68342 4.90237 10.3166 5.29289 10.7071C5.68342 11.0976 6.31658 11.0976 6.70711 10.7071L5.29289 9.29289ZM12 4L12.7071 3.29289C12.3166 2.90237 11.6834 2.90237 11.2929 3.29289L12 4ZM17.2929 10.7071C17.6834 11.0976 18.3166 11.0976 18.7071 10.7071C19.0976 10.3166 19.0976 9.68342 18.7071 9.29289L17.2929 10.7071ZM6.70711 10.7071L12.7071 4.70711L11.2929 3.29289L5.29289 9.29289L6.70711 10.7071ZM11.2929 4.70711L17.2929 10.7071L18.7071 9.29289L12.7071 3.29289L11.2929 4.70711Z" fill="#fff"></path>
                      <path d="M12 4L12 20" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="custom_arrows custom-next-arrow">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.7071 14.7071C19.0976 14.3166 19.0976 13.6834 18.7071 13.2929C18.3166 12.9024 17.6834 12.9024 17.2929 13.2929L18.7071 14.7071ZM12 20L11.2929 20.7071C11.6834 21.0976 12.3166 21.0976 12.7071 20.7071L12 20ZM6.70711 13.2929C6.31658 12.9024 5.68342 12.9024 5.29289 13.2929C4.90237 13.6834 4.90237 14.3166 5.29289 14.7071L6.70711 13.2929ZM17.2929 13.2929L11.2929 19.2929L12.7071 20.7071L18.7071 14.7071L17.2929 13.2929ZM12.7071 19.2929L6.70711 13.2929L5.29289 14.7071L11.2929 20.7071L12.7071 19.2929Z" fill="#fff"></path>
                      <path d="M12 20L12 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  {product?.images?.nodes.map((img, i) => {
                    return (
                      <SwiperSlide key={i} onClick={() => handleThumbnailClick(i)}>
                        <button className='noStyle d-block'>
                          <Image
                            alt={img.altText || 'Product Image'}
                            aspectRatio="0"
                            data={img}
                            sizes="200vw"
                          />
                        </button>
                      </SwiperSlide>
                    )
                  })}
                </Swiper>
              </div>
            </div>
          </div>
          <div className='col-lg-5 col-md-6'>
            <ProductMain
              selectedVariant={selectedVariant}
              product={product}
              variants={variants}
              metaFields={metaFields}
              showPopup={showPopup}
              handleQtyChange={handleQtyChange}
              handleQty={handleQty}
              quantity={quantity}
              location={location}
            />
          </div>
        </div>
      </div>

      {metaFields ?
        <div className='how_to_use_block primary-bg mt-5 py-5'>
          <div className='container'>
            <div className='row align-items-center'>
              <div className='col-sm-7'>
                <div className='p-4 px-5'>
                  <h2>{isJsonString(metaFields?.how_to_use_title) ? JSON.parse(metaFields?.how_to_use_title) : metaFields?.how_to_use_title}</h2>
                  {metaFields?.how_to_use_text ?
                    <div className='how_to_use_list'>
                      <ol className='px-3'>
                        {JSON.parse(metaFields?.how_to_use_text).map((opt, i) => {
                          return (
                            <li key={i} className='mb-3'>
                              {metaFields && metaFields?.bundle_how_to_use_heading && JSON.parse(metaFields?.bundle_how_to_use_heading)[i] ?
                                <strong>{JSON.parse(metaFields?.bundle_how_to_use_heading)[i]}: </strong>
                                : null
                              }
                              {opt}
                            </li>
                          )
                        })}
                      </ol>
                      {selectedVariant?.availableForSale ?
                        <AddToCartButton
                          fullBtn={false}
                          disabled={!selectedVariant || !selectedVariant.availableForSale}
                          onClick={() => {
                            setTimeout(() => {
                              window.location.href = window.location.href + '#cart-aside';
                            }, 500);
                          }}
                          lines={
                            selectedVariant
                              ? [{
                                merchandiseId: selectedVariant.id,
                                quantity: quantity || 1
                              }
                              ]
                              : []
                          }
                        >
                          Add to Bag
                          {selectedVariant ? <>
                            <Money data={selectedVariant?.price} as={"span"} className='mx-2' />
                            {selectedVariant?.compareAtPrice ? <s><Money data={selectedVariant?.compareAtPrice} as={"span"} /></s> : null}
                          </> : null
                          }
                        </AddToCartButton>
                        : null
                      }
                    </div>
                    : null
                  }
                </div>
              </div>
              <div className='col-sm-5'>
                {metaFields?.bundle_howtouse_video_link ?
                  <div className='how_to_use_video img-shadow'>
                    <video id="mydVideo" playsInline="" className="PlayTargetVideo d-block posterCover w_how" ref={videoRef} onEnded={handleVideoEnded}
                      width="100%" poster={metaFields?.bundle_how_to_use_poster_link} data-src={metaFields?.bundle_howtouse_video_link} src={metaFields?.bundle_howtouse_video_link} type="video/mp4">
                      Your browser does not support the video tag.
                    </video>
                    <button className={`playpauseBtn ${!videoPlay ? "play" : "pause"}`} id="videoplayBtn" tabIndex="0" onClick={playVideo}>
                      {!videoPlay ?
                        <img loading="lazy" src="https://cdn.shopify.com/s/files/1/0053/4462/4675/files/play__button.svg?v=1621433193" alt="play-button" width="" height="" className="playBtn" />
                        :
                        <img loading="lazy" src="https://cdn.shopify.com/s/files/1/0053/4462/4675/files/pause__icon.svg?v=1621433193" alt="pause-button" width="" height="" className="pausebtn" />
                      }
                    </button>
                  </div>
                  :
                  <Image
                    alt={""}
                    aspectRatio="0"
                    data={{ url: isJsonString(metaFields?.bundle_how_to_use_poster_link) ? JSON.parse(metaFields?.bundle_how_to_use_poster_link) : metaFields?.bundle_how_to_use_poster_link }}
                    sizes="200vw"
                    className='img-shadow'
                  />
                }
              </div>
            </div>


            {metaFields?.bundle_whatistarget_image && metaFields?.what_it_targets_text ?
              <div className='how_to_use_block mt-5'>
                <div className='row align-items-center'>
                  <div className='col-sm-5'>
                    <div className='what_it_target_slider'>
                      {(metaFields?.bundle_whatistarget_image && isJsonString(metaFields?.bundle_whatistarget_image) && JSON.parse(metaFields?.bundle_whatistarget_image).length > 1) || (typeof metaFields?.bundle_whatistarget_image == "object" && metaFields?.bundle_whatistarget_image.length > 1) ?
                        <div>
                          <div className='img-shadow'>
                            <Swiper
                              spaceBetween={0}
                              slidesPerView={1}
                              loop={true}
                              onSlideChange={handleSlideChange2}
                              autoHeight={true}
                              navigation={true}
                              modules={[Navigation]}
                              ref={swiperRef2}
                              onSwiper={(swiper) => console.log("swiper", swiper)}
                            >
                              {metaFields?.bundle_whatistarget_image && isJsonString(metaFields?.bundle_whatistarget_image) ?
                                <>
                                  {JSON.parse(metaFields?.bundle_whatistarget_image).map((img, i) => {
                                    return (
                                      <SwiperSlide key={i}>
                                        <Image
                                          alt={""}
                                          aspectRatio="0"
                                          data={{ url: img }}
                                          sizes="200vw"
                                        />
                                      </SwiperSlide>
                                    )
                                  })}
                                </>
                                : null
                              }
                            </Swiper>
                          </div>
                          <div className="short-info">
                            *The model in these images is a paid model demonstrating use and intended results of the products, these are not actual customer images.
                          </div>
                        </div>
                        :
                        (metaFields?.bundle_whatistarget_image && isJsonString(metaFields?.bundle_whatistarget_image) && JSON.parse(metaFields?.bundle_whatistarget_image).length == 1) || (typeof metaFields?.bundle_whatistarget_image == "object" && metaFields?.bundle_whatistarget_image.length == 1) ?
                          <Image
                            alt={""}
                            aspectRatio="0"
                            data={{ url: JSON.parse(metaFields?.bundle_whatistarget_image)[0] }}
                            sizes="200vw"
                            className='img-shadow'
                          />
                          :
                          typeof metaFields?.bundle_whatistarget_image == "string" ?
                            <Image
                              alt={""}
                              aspectRatio="0"
                              data={{ url: metaFields?.bundle_whatistarget_image }}
                              sizes="200vw"
                              className='img-shadow'
                            />
                            : null
                      }

                    </div>
                  </div>
                  <div className='col-sm-7'>
                    <div className='p-4 px-5'>
                      <h2>{isJsonString(metaFields?.target_title) ? JSON.parse(metaFields?.target_title) : metaFields?.target_title}</h2>
                      {metaFields?.what_it_targets_text ?
                        <div className='how_to_use_list'>
                          {JSON.parse(metaFields?.what_it_targets_text).map((opt, i) => {
                            return (
                              <div key={i} className='mb-3'>
                                <p className='mb-0'><strong>{JSON.parse(metaFields?.what_it_targets_heading)[i]}: </strong></p>
                                <p>{opt}</p>
                              </div>
                            )
                          })}
                          {selectedVariant?.availableForSale ?
                            <AddToCartButton
                              fullBtn={false}
                              disabled={!selectedVariant || !selectedVariant.availableForSale}
                              onClick={() => {
                                setTimeout(() => {
                                  window.location.href = window.location.href + '#cart-aside';
                                }, 500);
                              }}
                              lines={
                                selectedVariant
                                  ? [{
                                    merchandiseId: selectedVariant.id,
                                    quantity: quantity || 1
                                  }
                                  ]
                                  : []
                              }
                            >
                              Add to Bag
                              {selectedVariant ? <>
                                <Money data={selectedVariant?.price} as={"span"} className='mx-2' />
                                {selectedVariant?.compareAtPrice ? <s><Money data={selectedVariant?.compareAtPrice} as={"span"} /></s> : null}
                              </> : null
                              }
                            </AddToCartButton>
                            : null
                          }
                        </div>
                        : null
                      }
                    </div>
                  </div>
                </div>
              </div>
              : null
            }

            {metaFields?.bundle_subscribe_save_image && metaFields?.["subscribe-title"] ?
              <div className='how_to_use_block mt-5'>
                <div className='row flex-row-reverse align-items-center'>
                  <div className='col-sm-5'>
                    {metaFields?.bundle_subscribe_save_image ?
                      <div className='what_it_target_slider img-shadow'>
                        <Image
                          alt={""}
                          aspectRatio="0"
                          data={{ url: metaFields?.bundle_subscribe_save_image }}
                          sizes="200vw"
                        />
                      </div>
                      : null
                    }
                  </div>
                  <div className='col-sm-7'>
                    <div className='p-4 px-5'>
                      <h2>{isJsonString(metaFields?.["subscribe-title"]) ? JSON.parse(metaFields?.["subscribe-title"]) : metaFields?.["subscribe-title"]}</h2>
                      <div dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.subscribe_and_save_desc) ? JSON.parse(metaFields?.subscribe_and_save_desc) : metaFields?.subscribe_and_save_desc }}></div>

                      <div className='subscribe_save_block'>
                        <div className='subscribe_save_text_block'>
                          <img loading="lazy" src="https://cdn.shopify.com/s/files/1/0053/4462/4675/files/Ellipse_11_2.png?v=1686303350" alt="ellipse" width="24" height="24" />
                          &nbsp; Subscribe & save 10% on each order!
                        </div>
                        <div className='subscribe_save_select'>
                          {product?.sellingPlanGroups ?
                            <select onChange={handleOptionChange}>
                              {product?.sellingPlanGroups?.edges[0]?.node?.sellingPlans?.edges.map((data, index) => {
                                return (
                                  <option key={index} value={data?.node?.id}>{data?.node.name}</option>
                                  // <option key={index} value={product?.sellingPlanGroups?.edges[0]?.node?.options[0]?.values[index]}>{data?.node.name}</option>
                                )
                              })}
                            </select>
                            : null
                          }
                        </div>
                      </div>
                      <div className='whySubscribe'>
                        <button onClick={() => setShow(true)} className='noStyle'>Why should I subscribe?&nbsp;
                          <img src="https://cdn.shopify.com/s/files/1/0053/4462/4675/files/i-tip_2.svg?v=1686305428" alt="i" style={{ verticalAlign: "inherit" }} />
                        </button>
                      </div>
                      {selectedVariant?.sellingPlanAllocations ?
                        <div className='mt-3'>
                          <AddToCartButton
                            fullBtn={false}
                            disabled={!selectedVariant || !selectedVariant.availableForSale}
                            onClick={() => {
                              setTimeout(() => {
                                window.location.href = window.location.href + '#cart-aside';
                              }, 500);
                            }}
                            lines={
                              selectedVariant
                                ? [{
                                  merchandiseId: selectedVariant.id,
                                  quantity: quantity || 1,
                                  sellingPlanId: saveOption,
                                  // saveOption
                                }
                                ]
                                : []
                            }
                          >
                            {selectedVariant?.availableForSale ?
                              "Subscribe + Save"
                              :
                              "Sold out"
                            }
                            {selectedVariant ? <>
                              <Money data={selectedVariant?.sellingPlanAllocations?.edges[0].node?.priceAdjustments[0]?.price} as={"span"} className='mx-2' />
                              {selectedVariant?.compareAtPrice ? <s><Money data={selectedVariant?.compareAtPrice} as={"span"} /></s> : null}
                            </>
                              : null
                            }
                          </AddToCartButton>
                        </div>
                        : null
                      }
                    </div>
                  </div>
                </div>
              </div>
              : null
            }
          </div>
        </div>
        : null
      }

      <Stamped
        type="main"
        product={product}
        location={location}
      />
      <Modal show={show} onHide={handleClose} size='lg' centered>
        <Modal.Body>
          <p>Put your favorite Truly products on auto-ship and never worry about running about again! Simply select your desired frequency, and we’ll send you reminders a few days prior to each shipment.</p>
          <p><strong>Exclusive Perks:</strong></p>
          <ul>
            <li>Enjoy 10% off on all your auto-ship orders</li>
            <li>Special access and priority response time from our Priority Customer Experience Team</li>
            <li>Pause or cancel anytime</li>
          </ul>
        </Modal.Body>
      </Modal>
    </div >
  );
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @param {{image: ProductVariantFragment['image']}}
 */
function ProductImage({ image }) {
  if (!image) {
    return <div className="product-image" />;
  }
  return (
    <div className="product-image">
      <Image
        alt={image.altText || 'Product Image'}
        aspectRatio="0"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 200vw"
      />
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Promise<ProductVariantsQuery>;
 * }}
 */
function ProductMain({ selectedVariant, product, variants, metaFields, showPopup, quantity, handleQty, handleQtyChange, location }) {
  console.log("metaFields: ", metaFields)
  const { title, descriptionHtml, description } = product;
  const [openedNumber, setOpenedNumber] = useState(-1);
  const [openedNumber2, setOpenedNumber2] = useState(false);
  const [activeOption, setActiveOption] = useState("oneTime")
  const showStyle = {
    height: "auto"
  };
  const hideStyle = {
    height: "0",
    paddingTop: "0",
    paddingBottom: "0"
  };
  const handleRadioChange = (e) => {
    setActiveOption(e.target.value)
  }

  return (
    <div className="product-main">
      {metaFields ?
        <>
          <h1 className='mb-2'>{title}</h1>
          {metaFields?.bundle_product_short_title ?
            <p className='mb-1'><strong>
              {isJsonString(metaFields?.bundle_product_short_title) ?
                JSON.parse(metaFields?.bundle_product_short_title) :
                metaFields?.bundle_product_short_title}
            </strong></p>
            :
            null
          }
          <Stamped
            type="review"
            product={product}
            location={location}
          />

          {metaFields?.bundle_good_to_know ?
            <div className='good_to_know' dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.bundle_good_to_know) ? JSON.parse(metaFields?.bundle_good_to_know) : metaFields?.bundle_good_to_know }}></div>
            :
            metaFields?.good_to_know ?
              <div className='good_to_know' dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.good_to_know) ? JSON.parse(metaFields?.good_to_know) : metaFields?.good_to_know }}></div>
              :
              null
          }
          {metaFields?.bundle_product_short_descripti ?
            <p dangerouslySetInnerHTML={{ __html: metaFields?.bundle_product_short_descripti }}></p>
            :
            <p>{description}</p>
          }
          {metaFields?.bundle_whats_inside ?
            <div className='bundle_whats_inside'>
              <h5>{isJsonString(metaFields?.whats_inside_title) ? JSON.parse(metaFields?.whats_inside_title) : metaFields?.whats_inside_title}</h5>
              <div dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.bundle_whats_inside) ? JSON.parse(metaFields?.bundle_whats_inside) : metaFields?.bundle_whats_inside }}>
              </div>
            </div>
            : null
          }
          <ProductPrice
            selectedVariant={selectedVariant}
            quantity={quantity}
            handleQty={handleQty}
            handleQtyChange={handleQtyChange}
            showPopup={showPopup}
            handleRadioChange={handleRadioChange}
            activeOption={activeOption}
          />
          <Suspense
            fallback={
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={[]}
                quantity={quantity}
                activeOption={activeOption}
              />
            }
          >
            <Await
              errorElement="There was a problem loading product variants"
              resolve={variants}
            >
              {(data) => (
                <ProductForm
                  product={product}
                  selectedVariant={selectedVariant}
                  variants={data.product?.variants.nodes || []}
                  quantity={quantity}
                  activeOption={activeOption}
                />
              )}
            </Await>
          </Suspense>
          <br />
          {metaFields?.bundle_why_it_special && metaFields?.bundle_why_it_special_description ?
            <div className='bundle_why_it_special'>
              <h5 dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.bundle_why_it_special) ? JSON.parse(metaFields?.bundle_why_it_special) : metaFields?.bundle_why_it_special }}></h5>
              <div dangerouslySetInnerHTML={{ __html: metaFields?.bundle_why_it_special_description }}></div>
            </div>
            : null
          }
          {metaFields?.bundle_what_makes_good_title && metaFields?.bundle_what_makes_good_descrip ?
            <div className='bundle_why_it_special'>
              <h5 dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.bundle_what_makes_good_title) ? JSON.parse(metaFields?.bundle_what_makes_good_title) : metaFields?.bundle_what_makes_good_title }}></h5>
              <div dangerouslySetInnerHTML={{ __html: metaFields?.bundle_what_makes_good_descrip }}></div>
            </div>
            : null
          }
          {metaFields?.essential_ingradient_main_titl ?
            <h5 className='mb-2' dangerouslySetInnerHTML={{ __html: isJsonString(metaFields?.essential_ingradient_main_titl) ? JSON.parse(metaFields?.essential_ingradient_main_titl) : metaFields?.essential_ingradient_main_titl }}></h5>
            : null
          }
          {metaFields?.title ?
            <div className='ingrediant_tab'>
              {JSON.parse(metaFields?.title).map((opt, i) => {
                return (
                  <div className={`ingrediant_tab_panel ${openedNumber === i ? "active" : ""}`} key={opt}>
                    <div className='ingrediant_tab_header' onClick={() => setOpenedNumber(i !== openedNumber ? i : -1)}>
                      {opt}
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="9.334" height="17.334" viewBox="0 0 9.334 17.334">
                          <path d="M4.695,1.695a.667.667,0,0,1,.944,0l8,8a.667.667,0,0,1,0,.944l-8,8a.668.668,0,1,1-.944-.944l7.529-7.528L4.695,2.639a.667.667,0,0,1,0-.944Z" transform="translate(-4.5 -1.5)" fill="var(--color-dark)" fillRule="evenodd"></path>
                        </svg>
                      </span>
                    </div>
                    {metaFields?.description_essen ?
                      <div className='ingrediant_tab_body' style={openedNumber === i ? showStyle : hideStyle} dangerouslySetInnerHTML={{ __html: JSON.parse(metaFields?.description_essen)[i] }}>
                      </div>
                      : null
                    }
                  </div>
                )
              })}
            </div>
            : null
          }
          {metaFields?.key_ingredients_text ?
            <div className='ingrediant_tab'>
              <div className={`ingrediant_tab_panel ${openedNumber2 ? "active" : ""}`}>
                <div className='ingrediant_tab_header' onClick={() => setOpenedNumber2(!openedNumber2)}>
                  Full ingredients:
                  <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="9.334" height="17.334" viewBox="0 0 9.334 17.334">
                      <path d="M4.695,1.695a.667.667,0,0,1,.944,0l8,8a.667.667,0,0,1,0,.944l-8,8a.668.668,0,1,1-.944-.944l7.529-7.528L4.695,2.639a.667.667,0,0,1,0-.944Z" transform="translate(-4.5 -1.5)" fill="var(--color-dark)" fillRule="evenodd"></path>
                    </svg>
                  </span>
                </div>
                {metaFields?.key_ingredients_text ?
                  <div className='ingrediant_tab_body' style={openedNumber2 ? showStyle : hideStyle} dangerouslySetInnerHTML={{ __html: metaFields?.key_ingredients_text }}>
                  </div>
                  : null
                }
              </div>
            </div>
            : null
          }
        </>
        : null
      }
    </div>
  );
}

/**
 * @param {{
 *   selectedVariant: ProductFragment['selectedVariant'];
 * }}
 */
function ProductPrice({ selectedVariant, quantity, handleQtyChange, handleQty, showPopup, activeOption, handleRadioChange }) {
  return (
    <div className="product-price">
      <label className='product_purchase_options custom_radio'>
        <div className='d-flex align-items-center justify-content-between'>
          <input type='radio' checked={activeOption == "oneTime"} id="oneTime" name="sellingplan_option" value="oneTime" onChange={handleRadioChange} />
          <span></span>
          <div className=''>
            <p className='mb-0'><small>One-time purchase</small></p>
            {selectedVariant && selectedVariant?.compareAtPrice ? (
              <>
                <div className="product-price-on-sale">
                  {selectedVariant ? <>
                    <Money data={selectedVariant.price} />
                    <s>
                      <Money data={selectedVariant && selectedVariant.compareAtPrice} />
                    </s>
                  </>
                    : null
                  }
                </div>
              </>
            ) : (
              selectedVariant && selectedVariant?.price && <Money data={selectedVariant?.price} />
            )}
          </div>
        </div>
        {activeOption == "oneTime" ?
          <div className='product_qty_block'>
            <button onClick={() => handleQty("dec")}>-</button>
            <input type='number' value={quantity || 1} onChange={handleQtyChange} />
            <button onClick={() => handleQty("inc")}>+</button>
          </div>
          : null
        }
      </label>
      <label className='product_purchase_options custom_radio'>
        <div>
          <div className='d-flex align-items-center justify-content-between'>
            <input type='radio' checked={activeOption == "subscribe"} id="subscribe" name="sellingplan_option" value="subscribe" onChange={handleRadioChange} />
            <span></span>
            <div className=''>
              <p className='mb-0'><small>Subscribe & save 10% Off</small></p>
              {selectedVariant && selectedVariant?.compareAtPrice ? (
                <>
                  <div className="product-price-on-sale">
                    {selectedVariant ? <>
                      <Money data={selectedVariant?.sellingPlanAllocations?.edges[0].node?.priceAdjustments[0]?.price} />
                      <s>
                        <Money data={selectedVariant && selectedVariant?.compareAtPrice} />
                      </s>
                    </>
                      : null
                    }
                  </div>
                </>
              ) : (
                selectedVariant && selectedVariant?.sellingPlanAllocations?.edges[0].node?.priceAdjustments[0]?.price && <Money data={selectedVariant?.sellingPlanAllocations?.edges[0].node?.priceAdjustments[0]?.price} />
              )}
            </div>
          </div>
        </div>

        <div className='whySubscribe'>
          <button onClick={showPopup} className='noStyle'>
            <small>Why should I subscribe?&nbsp;
              <img src="https://cdn.shopify.com/s/files/1/0053/4462/4675/files/i-tip_2.svg?v=1686305428" alt="i" width={10} />
            </small>
          </button>
        </div>
      </label>
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Array<ProductVariantFragment>;
 * }}
 */
function ProductForm({ product, selectedVariant, variants, quantity, activeOption }) {
  console.log("selectedVariant: ", selectedVariant)
  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({ option }) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      <br />
      <AddToCartButton
        fullBtn
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          setTimeout(() => {
            window.location.href = window.location.href + '#cart-aside';
          }, 500);
        }}
        lines={
          selectedVariant
            ? [
              activeOption !== "oneTime" ? {
                merchandiseId: selectedVariant.id,
                quantity: quantity || 1,
                sellingPlanId: saveOption
              }
                :
                {
                  merchandiseId: selectedVariant.id,
                  quantity: quantity || 1
                }
            ]
            : []
        }
      >
        {activeOption !== "oneTime" ? "Subscribe Now" : selectedVariant?.availableForSale ? 'Add to Bag' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({ option }) {
  return (
    <div className="product-options mt-3" key={option.name}>
      {/* <h5>{option.name}</h5> */}
      <div className="product-options-grid">
        {option.values.map(({ value, isAvailable, isActive, to }) => {
          return (
            <Link
              className={`product-options-item ${isActive ? "active" : ""}`}
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              style={{
                opacity: isAvailable ? 1 : 0.3,
              }}
            >
              {value}
            </Link>
          );
        })}
      </div>
      <br />
    </div>
  );
}

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: CartLineInput[];
 *   onClick?: () => void;
 * }}
 */
function AddToCartButton({ analytics, children, disabled, lines, onClick, fullBtn }) {
  return (
    <CartForm route="/cart" inputs={{ lines }} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            className={`btn btn-primary btn-lg ${fullBtn ? "w-100" : ""}`}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sellingPlanAllocations(first:1){
      edges{
        node{
          sellingPlan{
            id
          }
          priceAdjustments{
            price{
              amount
              currencyCode
            }
          }
        }
      }
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    productType
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
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
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
    sellingPlanGroups(first: 3) {
      edges {
        node {
          name
          appName
          options {
            name
            values
          }
          sellingPlans(first: 3) {
          edges {
            node {
              id
              name
              options{
                value
                name
              }
            }
          }
        }
        }
      }
    }
    metafields(
      identifiers: [{namespace: "accentuate", key: "bundle_product_short_title"}, {namespace: "accentuate", key: "sub_title_one"}, {namespace: "accentuate", key: "sub_title_two"}, {namespace: "accentuate", key: "sub_title_one"}, {namespace: "accentuate", key: "bundle_good_to_know"}, {namespace: "accentuate", key: "good_to_know_title"}, {namespace: "accentuate", key: "good_to_know"}, {namespace: "accentuate", key: "bundle_product_short_descripti"}, {namespace: "accentuate", key: "description"}, {namespace: "accentuate", key: "bundle_whats_inside"}, {namespace: "accentuate", key: "whats_inside_title"}, {namespace: "accentuate", key: "bundle_why_it_special_description"}, {namespace: "accentuate", key: "bundle_why_it_special"}, {namespace: "accentuate", key: "why_its_special"}, {namespace: "accentuate", key: "bundle_what_makes_good_title"}, {namespace: "accentuate", key: "bundle_what_makes_good_descrip"}, {namespace: "accentuate", key: "title"}, {namespace: "accentuate", key: "essential_ingradient_main_titl"}, {namespace: "accentuate", key: "description_essen"}, {namespace: "accentuate", key: "key_ingredients"}, {namespace: "accentuate", key: "full_ingradient_main_titl"}, {namespace: "accentuate", key: "full_ingredient_text"}, {namespace: "accentuate", key: "full_ingredient_title"}, {namespace: "product", key: "key_ingredients_text"}, {namespace: "accentuate", key: "how_to_use_title"}, {namespace: "accentuate", key: "bundle_howtouse_video_link"}, {namespace: "accentuate", key: "how_to_use_text"}, {namespace: "accentuate", key: "bundle_how_to_use_heading"}, {namespace: "accentuate", key: "bundle_howtouse_video_link"}, {namespace: "accentuate", key: "bundle_how_to_use_poster_link"}, {namespace: "accentuate", key: "target_title"}, {namespace: "accentuate", key: "what_it_targets_heading"}, {namespace: "accentuate", key: "what_it_targets_text"}, {namespace: "accentuate", key: "bundle_whatistarget_image"}, {namespace: "accentuate", key: "bundle_what_it_targets_video"}, {namespace: "accentuate", key: "subscribe_and_save_desc"}, {namespace: "accentuate", key: "subscribe-title"}, {namespace: "accentuate", key: "bundle_subscribe_save_image"}]
    ) {
      key
      value
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @template T @typedef {import('@remix-run/react').V2_MetaFunction<T>} V2_MetaFunction */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantsQuery} ProductVariantsQuery */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
/** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineInput} CartLineInput */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
