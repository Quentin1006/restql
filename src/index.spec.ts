import RestQL from "./index";

const defaultResolver = (response: any, root: any, ctx: any) => {
  console.log(root, ctx, "defaultResolver");
  return response.data;
};
console.log("start");
const restql = new RestQL({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: {},
  transform: defaultResolver,
});

const userResolver = (response: any, root: any, ctx: any) => {
  console.log(root, ctx, "userResolver");
  return response.data;
};
const userCommentsResolver = (response: any, parent: any, ctx: any) => {
  console.log(parent, ctx, "userCommentsResolver");
  return response.data;
};

const userPostFilter = (parent: any, ctx: any) => {
  return !parent.website;
};

const evenIdFilter = (id: number) => (parent: any, ctx: any) => {
  return parseInt(parent[id].id, 10) % 2 === 0;
};

const restqlSchemaBasic = [
  {
    key: "personne_1",
    url: "/users/1",
    transform: userResolver,
    then: [
      {
        key: "comment_1.1",
        url: "/comments/${parent.id}",
        transform: userCommentsResolver,
      },
      {
        key: "post_1.2",
        url: "/posts/${parent.id}",
        only: userPostFilter,
      },
    ],
  },
  {
    key: "comment_2",
    url: "/comments/3",
    then: [
      {
        key: "post_2.2",
        url: "/posts/${parent.id}",
        only: userPostFilter,
      },
    ],
  },
];

const restqlSchema = [
  {
    key: "personne",
    url: "/users/1",
    then: [
      {
        key: "personne_albums",
        url: "/users/#{parent.id}/albums",
        then: (parent: any) =>
          parent.map((album: any, idx: number) => ({
            key: `personne_albums_comment_${album.id}`,
            url: `/comments/${album.id}`,
            // Warning: The parent here is not the specific album
            // But the array of album. This is why we need to pass the idx
            // to retrieve the right parent in the filter function
            only: evenIdFilter(idx),
          })),
      },
      {
        key: "personne_post",
        url: "/posts/#{parent.id}",
        only: userPostFilter,
      },
    ],
  },
  {
    key: "comment",
    url: "/comments/3",
    then: [
      {
        key: "comment_post",
        url: "/posts/#{parent.id}",
        only: userPostFilter,
      },
    ],
  },
];

restql.query(restqlSchema).then((res) => {
  console.log(res);
});
