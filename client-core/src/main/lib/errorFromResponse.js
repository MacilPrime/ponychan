/* @flow */

export default async function errorFromResponse(response: Response): Promise<Error> {
  const error = new Error(response.statusText);

  const {status, statusText} = response;

  let text, json;
  if (response.headers.get('Content-Type') === 'application/json') {
    json = await response.json();
  } else {
    text = await response.text();
  }
  (error:any).details = {status, statusText, text, json};

  return error;
}
