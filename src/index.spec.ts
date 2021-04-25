import { ServerResponse } from "node:http";
import RestQL from "./index";

console.log("start");
const restql = new RestQL({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: {},
});

const userResolver = (response: any, root: any, ctx: any) => {
  console.log(root, ctx, "userResolver");
  return response.data;
};
const userCommentsResolver = (response: any, parent: any, ctx: any) => {
  console.log(parent, ctx, "userCommentsResolver");
  return response.data;
};

const restqlSchema = [
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
      },
    ],
  },
  {
    key: "comment_2",
    url: "/comments/3",
  },
];

restql.query(restqlSchema).then((res) => {
  console.log(res);
});
