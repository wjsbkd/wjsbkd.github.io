import{p as e}from"./dist-BPOi4vSH.js";import{a as t,t as n}from"./compat-6G37Q4kt.js";var r=t({projectId:e.projectId||`placeholder`,dataset:e.dataset,apiVersion:e.apiVersion,useCdn:!0,perspective:`published`}),i=null;function a(e){i=n(e)}function o(e){return{_type:`image`,asset:{_type:`reference`,_ref:e.id},hotspot:e.hotspot??void 0}}function s(e,t={}){if(!e?.id||!i)return;let{width:n,height:r,quality:a=82}=t,s=i.image(o(e)).quality(a).format(`webp`).auto(`format`);return n&&(s=s.width(Math.round(n))),r&&(s=s.height(Math.round(r))),s.url()||void 0}function c(e){return e}var l=`
  "id": asset._ref,
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  hotspot,
  "blurDataURL": asset->metadata.lqip,
  alt
`,u=`
  mediaType,
  image { ${l} },
  videoFile { "url": asset->url, "size": asset->size },
  videoUrl,
  poster { ${l} },
  autoplay,
  loop,
  muted
`,d=`
  moduleType,
  image { ${l} },
  alt,
  caption,
  gallery[] { ${l} },
  videoFile { "url": asset->url, "size": asset->size },
  videoUrl,
  poster { ${l} },
  autoplay,
  loop,
  muted,
  imageTextTitle,
  imageTextBody
`,f=c(`
  *[_type == "project" && status == "published"] | order(sortOrder asc) {
    "id": _id,
    title,
    "slug": slug.current,
    year,
    summary,
    subtitle,
    stat,
    label,
    background,
    responsibility,
    result,
    featured,
    sortOrder,
    cover { ${u} },
    "category": category-> {
      "id": _id,
      title,
      "slug": slug.current
    }
  }
`),p=c(`
  *[_type == "project" && slug.current == $slug && status == "published"][0] {
    "id": _id,
    title,
    "slug": slug.current,
    year,
    summary,
    subtitle,
    stat,
    label,
    background,
    responsibility,
    result,
    description,
    featured,
    sortOrder,
    "createdAt": _createdAt,
    "updatedAt": _updatedAt,
    cover { ${u} },
    media[] { ${d} },
    "category": category-> {
      "id": _id,
      title,
      "slug": slug.current
    }
  }
`),m=c(`
  *[_type == "project" && status == "published"] { "slug": slug.current }
`),h=`
  "id": asset._ref,
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  hotspot,
  "blurDataURL": asset->metadata.lqip
`,g=c(`
  *[_id == "resume"][0] {
    name,
    role,
    avatar { ${h} },
    bio,
    location,
    email,
    phone,
    phoneTel,
    wechat,
    social[] { 
  _key,
  platform,
  url,
  note
 },
    resumeFile { 
  "url": asset->url,
  "size": asset->size,
  "originalFilename": asset->originalFilename
 },

    "experience": experience[status == "published"] | order(sortOrder asc) {
      _key,
      company,
      role,
      startDate,
      endDate,
      current,
      description,
      points[]{ _key, label, text },
      tags,
      sortOrder
    },
    "education": education[status == "published"] | order(sortOrder asc) {
      _key, school, degree, major, startDate, endDate, description, sortOrder
    },
    "awards": awards[status == "published"] | order(sortOrder asc) {
      _key, title, issuer, date, description, sortOrder
    },
    "exhibitions": exhibitions[status == "published"] | order(sortOrder asc) {
      _key, title, role, location, date, description, sortOrder
    },
    "services": services[status == "published"] | order(sortOrder asc) {
      _key, title, description, sortOrder
    },
    "skills": skills[status == "published"] | order(sortOrder asc) {
      _key, name, level, sortOrder
    },
    "clients": clients[status == "published"] | order(sortOrder asc) {
      _key, name, logo { ${h} }, url, note, sortOrder
    }
  }
`),_=c(`
  *[_id == "siteSettings"][0] {
    siteName,
    intro,
    seoTitle,
    seoDescription,
    shareCover { 
  "id": asset._ref,
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  hotspot,
  "blurDataURL": asset->metadata.lqip
 },
    footerText,
    contact {
      email,
      phone,
      phoneTel,
      wechat
    },
    social[] { 
  _key, platform, url, note
 },
    backgroundMusic {
      enabled,
      name,
      audioFile { 
  "url": asset->url,
  "size": asset->size,
  "originalFilename": asset->originalFilename
 },
      audioUrl,
      loop,
      volume
    }
  }
`);function v(e){if(!e)return{coverType:`image`,image:``,alt:``,poster:``,cover:{mediaType:`image`}};if(e.mediaType===`video`){let t=s(e.poster)??``,n=e.videoFile?.url??e.videoUrl??void 0;return{coverType:`video`,image:t,alt:e.poster?.alt??``,videoUrl:n,poster:t,cover:{mediaType:`video`,videoUrl:n,poster:t,autoplay:e.autoplay,loop:e.loop,muted:e.muted}}}let t=s(e.image)??``;return{coverType:`image`,image:t,alt:e.image?.alt??``,poster:t,cover:{mediaType:`image`,image:t,alt:e.image?.alt??``}}}function y(e,t=0){let n=v(e.cover);return{id:e.id,slug:e.slug,title:e.title,year:e.year,index:String(t+1).padStart(2,`0`),subtitle:e.subtitle||e.category?.title||e.summary.slice(0,12),summary:e.summary,stat:e.stat??``,label:e.label??``,background:e.background||e.summary,responsibility:e.responsibility??``,result:e.result??``,featured:e.featured,sortOrder:e.sortOrder,category:e.category,...n}}function b(e){let t={moduleType:e.moduleType};switch(e.moduleType){case`image`:t.image=s(e.image)??``,t.alt=e.alt??``,t.caption=e.caption;break;case`gallery`:t.gallery=(e.gallery??[]).map(e=>s(e)??``).filter(Boolean),t.caption=e.caption;break;case`video`:t.videoUrl=e.videoFile?.url??e.videoUrl??void 0,t.poster=s(e.poster)??``,t.autoplay=e.autoplay,t.loop=e.loop,t.muted=e.muted;break;case`imageText`:t.image=s(e.image)??``,t.imageTextTitle=e.imageTextTitle,t.imageTextBody=e.imageTextBody}return t}function x(e){let t=v(e.cover);return{id:e.id,slug:e.slug,title:e.title,year:e.year,index:String(e.sortOrder+1).padStart(2,`0`),subtitle:e.subtitle||e.category?.title||e.summary.slice(0,12),summary:e.summary,stat:e.stat??``,label:e.label??``,background:e.background||e.summary,responsibility:e.responsibility??``,result:e.result??``,featured:e.featured,sortOrder:e.sortOrder,category:e.category,...t,description:e.description??null,media:(e.media??[]).map(b),createdAt:e.createdAt,updatedAt:e.updatedAt}}function S(e){return e?e.map(e=>({period:e.current?`${e.startDate} — 至今`:`${e.startDate} — ${e.endDate??``}`,company:e.company,role:e.role,tags:e.tags??[],points:(e.points??[]).map(e=>({label:e.label??``,text:e.text}))})):[]}function C(e){return e?{name:e.name,role:e.role,avatar:s(e.avatar),bio:e.bio,location:e.location,email:e.email,phone:e.phone,phoneTel:e.phoneTel,wechat:e.wechat??e.social?.find(e=>e.platform.includes(`微信`))?.note,social:e.social??[],resumeFile:e.resumeFile?.url}:null}function w(e){return e?e.map(e=>({_key:e._key,title:e.school,school:e.school,degree:e.degree,major:e.major,subtitle:[e.degree,e.major].filter(Boolean).join(` · `),description:e.description,sortOrder:e.sortOrder})):[]}function T(e){return e?e.map(e=>({_key:e._key,title:e.title,subtitle:e.issuer??e.role??e.location??``,description:e.description,sortOrder:e.sortOrder})):[]}function E(e){return e?e.map(e=>({_key:e._key,name:e.name,level:e.level,title:e.name,subtitle:e.level,sortOrder:e.sortOrder})):[]}function D(e){return e?e.map(e=>({_key:e._key,name:e.name,logo:s(e.logo),url:e.url,note:e.note,title:e.name,subtitle:e.note,sortOrder:e.sortOrder})):[]}function O(e){if(!e)return{contact:{},social:[]};let t=e.backgroundMusic,n=t?.audioFile?.url??t?.audioUrl??void 0;return{siteName:e.siteName,intro:e.intro,seoTitle:e.seoTitle,seoDescription:e.seoDescription,shareCover:s(e.shareCover),footerText:e.footerText,contact:{email:e.contact?.email,phone:e.contact?.phone,phoneTel:e.contact?.phoneTel,wechat:e.contact?.wechat},social:e.social??[],backgroundMusic:t?{enabled:!!t.enabled,name:t.name,url:n,loop:!!t.loop,volume:typeof t.volume==`number`?t.volume:.35}:void 0}}var k=8e3;a(r);async function A(e,t={}){let n=new AbortController,i=setTimeout(()=>n.abort(),k);try{return await r.fetch(e,t,{signal:n.signal})}finally{clearTimeout(i)}}async function j(){return{projects:(await A(f)).map((e,t)=>y(e,t)),source:`sanity`}}async function M(e){let t=await A(p,{slug:e});return t?x(t):null}async function N(){return(await A(m)).map(e=>e.slug)}async function P(){let e=await A(g);if(!e)throw Error(`resume 单例不存在`);let t=S(e.experience);if(t.length===0)throw Error(`resume 已发布的工作经历为空，回退本地数据`);return{experiences:t,profile:C(e),education:w(e.education),awards:T(e.awards),exhibitions:T(e.exhibitions),services:T(e.services),skills:E(e.skills),clients:D(e.clients),source:`sanity`}}async function F(){let e=await A(_);if(!e)throw Error(`siteSettings 单例不存在`);let t=O(e);return{siteName:t.siteName,intro:t.intro,seo:t,source:`sanity`}}export{M as fetchProjectBySlug,N as fetchProjectSlugs,j as fetchProjects,P as fetchResume,F as fetchSiteSettings};