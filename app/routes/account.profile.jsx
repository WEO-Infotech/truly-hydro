import { json, redirect } from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';

/**
 * @type {V2_MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Profile' }];
};

/**
 * @param {LoaderArgs}
 */
export async function loader({ context }) {
  const customerAccessToken = await context.session.get('customerAccessToken');
  if (!customerAccessToken) {
    return redirect('/account/login');
  }
  return json({});
}

/**
 * @param {ActionArgs}
 */
export async function action({ request, context }) {
  const { session, storefront } = context;

  if (request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const form = await request.formData();
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const password = getPassword(form);
    const customer = {};
    const validInputKeys = [
      'firstName',
      'lastName',
      'email',
      'password',
      'phone',
    ];
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key)) {
        continue;
      }
      if (key === 'acceptsMarketing') {
        customer.acceptsMarketing = value === 'on';
      }
      if (typeof value === 'string' && value.length) {
        customer[key] = value;
      }
    }

    if (password) {
      customer.password = password;
    }

    // update customer and possibly password
    const updated = await storefront.mutate(CUSTOMER_UPDATE_MUTATION, {
      variables: {
        customerAccessToken: customerAccessToken.accessToken,
        customer,
      },
    });

    // check for mutation errors
    if (updated.customerUpdate?.customerUserErrors?.length) {
      return json(
        { error: updated.customerUpdate?.customerUserErrors[0] },
        { status: 400 },
      );
    }

    // update session with the updated access token
    if (updated.customerUpdate?.customerAccessToken?.accessToken) {
      session.set(
        'customerAccessToken',
        updated.customerUpdate?.customerAccessToken,
      );
    }

    return json(
      { error: null, customer: updated.customerUpdate?.customer },
      {
        headers: {
          'Set-Cookie': await session.commit(),
        },
      },
    );
  } catch (error) {
    return json({ error: error.message, customer: null }, { status: 400 });
  }
}

export default function AccountProfile() {
  const account = useOutletContext();
  const { state } = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();
  const customer = action?.customer ?? account?.customer;

  return (
    <div className="account-profile">
      <h2>My profile</h2>
      <br />
      <Form method="PUT">
        <div className='row justify-content-between'>
          <div className='col-md-6'>
            <legend>Personal information</legend>
            <fieldset>
              <div className='row'>
                <div className='col-md-6'>
                  <div className='form-group mb-3'>
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="First name"
                      aria-label="First name"
                      defaultValue={customer.firstName ?? ''}
                      minLength={2}
                      className='form-control sm'
                    />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group mb-3'>
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Last name"
                      aria-label="Last name"
                      defaultValue={customer.lastName ?? ''}
                      minLength={2}
                      className='form-control sm'
                    />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group mb-3'>
                    <label htmlFor="phone">Mobile</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Mobile"
                      aria-label="Mobile"
                      defaultValue={customer.phone ?? ''}
                      className='form-control sm'
                    />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group mb-3'>
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Email address"
                      aria-label="Email address"
                      defaultValue={customer.email ?? ''}
                      className='form-control sm'
                    />
                  </div>
                </div>
                <div className='col-md-12'>
                  <div className='form-group mb-3'>
                    <div className="account-profile-marketing">
                      <input
                        id="acceptsMarketing"
                        name="acceptsMarketing"
                        type="checkbox"
                        placeholder="Accept marketing"
                        aria-label="Accept marketing"
                        defaultChecked={customer.acceptsMarketing}
                      />
                      <label htmlFor="acceptsMarketing">
                        &nbsp; Subscribed to marketing communications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          <div className='col-md-5'>
            <legend>Change password (optional)</legend>
            <fieldset>
              <div className='row'>
                <div className='col-md-12'>
                  <div className='row'>
                    <div className='col-md-6'>
                      <div className='form-group mb-3'>
                        <label htmlFor="currentPassword">Current password</label>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Current password"
                          aria-label="Current password"
                          minLength={4}
                          className='form-control sm'
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group mb-3'>
                    <label htmlFor="newPassword">New password</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="New password"
                      aria-label="New password"
                      minLength={4}
                      className='form-control sm'
                    />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group mb-3'>
                    <label htmlFor="newPasswordConfirm">Confirm new password</label>
                    <input
                      id="newPasswordConfirm"
                      name="newPasswordConfirm"
                      type="password"
                      placeholder="Confirm new password"
                      aria-label="Confirm new password"
                      minLength={4}
                      className='form-control sm'
                    />
                    <small>Passwords must be at least 4 characters.</small>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        {action?.error ? (
          <p>
            <mark>
              <small>{action.error}</small>
            </mark>
          </p>
        ) : (
          <br />
        )}
        <button type="submit" className='btn btn-primary btn-sm' disabled={state !== 'idle'}>
          {state !== 'idle' ? 'Updating' : 'Update'}
        </button>
      </Form>
    </div>
  );
}

/**
 * @param {FormData} form
 */
function getPassword(form) {
  let password;
  const currentPassword = form.get('currentPassword');
  const newPassword = form.get('newPassword');
  const newPasswordConfirm = form.get('newPasswordConfirm');

  let passwordError;
  if (newPassword && !currentPassword) {
    passwordError = new Error('Current password is required.');
  }

  if (newPassword && newPassword !== newPasswordConfirm) {
    passwordError = new Error('New passwords must match.');
  }

  if (newPassword && currentPassword && newPassword === currentPassword) {
    passwordError = new Error(
      'New password must be different than current password.',
    );
  }

  if (passwordError) {
    throw passwordError;
  }

  if (currentPassword && newPassword) {
    password = newPassword;
  } else {
    password = currentPassword;
  }

  return String(password);
}

const CUSTOMER_UPDATE_MUTATION = `#graphql
  # https://shopify.dev/docs/api/storefront/latest/mutations/customerUpdate
  mutation customerUpdate(
    $customerAccessToken: String!,
    $customer: CustomerUpdateInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customer {
        acceptsMarketing
        email
        firstName
        id
        lastName
        phone
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

/**
 * @typedef {{
 *   error: string | null;
 *   customer: CustomerFragment | null;
 * }} ActionResponse
 */

/** @typedef {import('storefrontapi.generated').CustomerFragment} CustomerFragment */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').CustomerUpdateInput} CustomerUpdateInput */
/** @typedef {import('@shopify/remix-oxygen').ActionArgs} ActionArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @template T @typedef {import('@remix-run/react').V2_MetaFunction<T>} V2_MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
