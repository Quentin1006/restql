import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { v4 as uuidv4 } from "uuid";

type RestQLContext = {
  client: Record<string, any>;
  instanceId: string;
  baseURL: string;
  headers: Record<string, string>;
  transform?: RestQLTransform;
};

type RestQLTransform = {
  (originalResult: RestQLResponse, parent: any, ctx: RestQLContext): any; // Redefine any
};

type RestQLFilter = {
  (parent: any, ctx: RestQLContext): any; // Redefine any
};

interface BaseRessource {
  key: string;
  transform?: RestQLTransform;
  only?: RestQLFilter;
  then?: Ressource[] | ((parent: any) => Ressource[]);
}

interface Link extends BaseRessource {
  link: string;
}

interface Url extends BaseRessource {
  url: string;
  params?: any;
}

type Ressource = Link | Url;

type RestQLSchema = Ressource[];

type CacheStore = {
  [k: string]: any;
};

type RestQLRequestConfig = AxiosRequestConfig;

type RestQLResponse = AxiosResponse;
type RestQLOptions = {
  baseURL: string;
  headers: Record<string, string>;
  beforeRequest?: (
    config: RestQLRequestConfig,
    ctx: RestQLContext,
  ) => RestQLRequestConfig;
  afterResponse?: (
    response: RestQLResponse,
    ctx: RestQLContext,
  ) => RestQLResponse;
  cacheStore?: CacheStore;
  clientCtx?: Record<string, any>;
  root?: Record<string, any>;
  transform?: RestQLTransform;
};

class RestQL {
  protected transporter: AxiosInstance;
  protected cache = {};
  protected ctx: RestQLContext;
  protected root;
  constructor({
    baseURL,
    headers,
    beforeRequest,
    afterResponse,
    clientCtx,
    transform,
    root = {},
  }: RestQLOptions) {
    this.transporter = axios.create({
      baseURL,
      headers,
    });

    this.ctx = {
      client: clientCtx || {},
      instanceId: uuidv4(),
      baseURL,
      headers,
      transform,
    };

    beforeRequest &&
      this.transporter.interceptors.request.use(
        (config: RestQLRequestConfig) => {
          beforeRequest(config, this.ctx);
          return config;
        },
      );

    afterResponse &&
      this.transporter.interceptors.response.use((response: RestQLResponse) => {
        afterResponse(response, this.ctx);
        return response;
      });

    this.root = root;
  }
  async query(schema: RestQLSchema): Promise<any> {
    const globalResult = {};
    await this._runQueries(schema, {}, this.ctx, globalResult);

    return globalResult;
  }

  async _runQueries(
    schema: RestQLSchema,
    parent: any,
    ctx: RestQLContext,
    globalResult: any,
  ) {
    return Promise.all(
      schema
        .filter(({ only }) => (only ? only(parent, ctx) : true))
        .map(async (ressource) => {
          let result;
          try {
            console.log("Start treating Ressource:", ressource.key);
            const ressourceAsUrl = ressource as Url;
            const ressourceAsLink = ressource as Link;
            const endpoint =
              this._replacePattern(ressourceAsUrl.url, parent) ||
              ressourceAsLink.link;

            const originalResult = await this.transporter.get(endpoint);

            const transform = ressource.transform || ctx.transform;
            result = transform
              ? transform(originalResult, parent, ctx)
              : originalResult;
            console.log("End treating Ressource:", ressource.key);

            if (ressource.then) {
              const then: Ressource[] =
                typeof ressource.then === "function"
                  ? ressource.then(result) // The result here is the parent of the then block
                  : ressource.then;

              await this._runQueries(then, result, ctx, globalResult);
            }
          } catch (error) {
            if (error.response) {
              result = error.response;
            }
          }
          globalResult[ressource.key] = result;

          return result;
        }),
    );
  }

  _replacePattern<Parent = any>(pattern: string, parent: Parent): string {
    return pattern.replace(/#{((\w|\.)+)}/g, (corresp, p1) => {
      const keysPathAsArray = p1.split(".");
      // Remove the parent object from the keys
      keysPathAsArray.shift();
      return keysPathAsArray.reduce(
        (parent: any, key: any) => parent[key],
        parent,
      );
    });
  }
}

export default RestQL;
