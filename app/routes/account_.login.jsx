import { json, redirect } from '@shopify/remix-oxygen';
import { Form, Link, useActionData } from '@remix-run/react';

/**
 * @type {V2_MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Login' }];
};

/**
 * @param {LoaderArgs}
 */
export async function loader({ context }) {
  if (await context.session.get('customerAccessToken')) {
    return redirect('/account');
  }
  return json({});
}

/**
 * @param {ActionArgs}
 */
export async function action({ request, context }) {
  const { session, storefront } = context;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const form = await request.formData();
    const email = String(form.has('email') ? form.get('email') : '');
    const password = String(form.has('password') ? form.get('password') : '');
    const validInputs = Boolean(email && password);

    if (!validInputs) {
      throw new Error('Please provide both an email and a password.');
    }

    const { customerAccessTokenCreate } = await storefront.mutate(
      LOGIN_MUTATION,
      {
        variables: {
          input: { email, password },
        },
      },
    );

    if (!customerAccessTokenCreate?.customerAccessToken?.accessToken) {
      throw new Error(customerAccessTokenCreate?.customerUserErrors[0].message);
    }

    const { customerAccessToken } = customerAccessTokenCreate;
    session.set('customerAccessToken', customerAccessToken);

    return redirect('/account', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 400 });
    }
    return json({ error }, { status: 400 });
  }
}

export default function Login() {
  /** @type {ActionReturnData} */
  const data = useActionData();
  const error = data?.error || null;

  return (
    <div className="login-page">
      <div className="commonSection">
        <div className="container-fluid">
          <div className="login-page-inner">
            <h2 className='text-center'>Sign in.</h2>
            <Form method="POST">
              <fieldset>
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
                    className='form-control w-100'
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                </div>
                <div className='form-group mb-3'>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    aria-label="Password"
                    className='form-control w-100'
                    minLength={8}
                    required
                  />
                </div>
              </fieldset>
              {error ? (
                <p className='text-danger mb-2'>
                  <mark>
                    <small>{error}</small>
                  </mark>
                </p>
              ) : (
                null
              )}
              <button type="submit" className='btn btn-primary w-100'>Sign in</button>
            </Form>
            <br />
            <div className='d-flex justify-content-between'>
              <p className='text-center'>
                Don't have an account? <Link to="/account/register" className='link text-danger'>Register</Link>
              </p>
              <p className='text-end'>
                <Link to="/account/recover" className='text-danger'>Forgot password?</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/mutations/customeraccesstokencreate
const LOGIN_MUTATION = `#graphql
  mutation login($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerUserErrors {
        code
        field
        message
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
    }
  }
`;

/**
 * @typedef {{
 *   error: string | null;
 * }} ActionResponse
 */

/** @typedef {import('@shopify/remix-oxygen').ActionArgs} ActionArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderArgs} LoaderArgs */
/** @template T @typedef {import('@remix-run/react').V2_MetaFunction<T>} V2_MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
