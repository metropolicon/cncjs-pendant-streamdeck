let fetchImplementation

if (import.meta.env.SSR) {
  fetchImplementation = require('node-fetch')
  console.log('import.meta.env.SSR')
} else {
  fetchImplementation = window.fetch
  console.log('window.fetch')
}

export default (token, host, port) => {
  const url = (path, params) => {
    const queryParams = new URLSearchParams({
      token,
      ...params,
    })
    return `http://${host}:${port}/api/${path}?${queryParams}`
  }

  const apiFetch = async (path, params) => {
    const fetchUrl = url(path, params)
    const results = await fetchImplementation(fetchUrl)
    return results.json()
  }

  const apiPost = async (path, params) => {
    const postUrl = url(path, params)
    console.log("POST-> :",postUrl)
    const results = await fetchImplementation(postUrl, { method: 'POST' })
    return results.json()
  }
  
  const apiMyPost = async (path, params) => {
  // POST request using fetch with async/await
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  };
  const response = await fetch(url(path,""), requestOptions);
  const data = await response.json();
  
}
const apiMyDelete = async (path, params) => {
  // POST request using fetch with async/await
  const requestOptions = {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  };
  const response = await fetch(url(path,""), requestOptions);
  const data = await response.json();
  
}

  return {
    fetch: apiFetch,
    post: apiPost,
    mypost: apiMyPost,
    mydelete: apiMyDelete,
  }
}
