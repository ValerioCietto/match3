export function mockGL() {
  let id=0;
  const calls=[];
  const values={calls,getShaderParameter:()=>true,getProgramParameter:()=>true,
    getAttribLocation:()=>id++,getUniformLocation:(_,name)=>name,
    createShader:()=>({id:id++}),createProgram:()=>({id:id++}),createBuffer:()=>({id:id++})};
  return new Proxy(values,{get(target,key){
    if(key in target)return target[key];
    if(key===key.toUpperCase())return target[key]=++id;
    return (...args)=>{calls.push([key,...args]);};
  }});
}
