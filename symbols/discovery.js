(() => {
  const featured = [
    'nature-bird-common-kingfisher','nature-plant-iris-tectorum','expanded-animal_insect',
    'nature-bird-barn-swallow','nature-plant-lavandula-angustifolia','nature-insect-honeybee',
    'nature-bird-light-vented-bulbul','nature-plant-hemerocallis-fulva','nature-insect-globe-skimmer',
    'nature-bird-oriental-magpie-robin','nature-plant-trifolium-repens','nature-insect-cicada',
    'nature-bird-eurasian-tree-sparrow','nature-plant-verbena-bonariensis','nature-insect-mantis',
    'nature-bird-white-wagtail','nature-plant-miscanthus-sinensis','nature-insect-locust'
  ];
  const ranks=new Map(featured.map((id,i)=>[id,i]));
  const rank=item=>ranks.get(item.id)??10000;
  const date=item=>Date.parse(item.published_at||item.created_at||'')||0;
  function sort(items,mode,metrics=new Map()) {
    const count=(item,key)=>Number(metrics.get(item.id)?.[key])||0;
    const popularity=item=>count(item,'likes')+count(item,'saves')*2;
    return [...items].sort((a,b)=>{
      let difference=0;
      if(mode==='recommended') difference=rank(a)-rank(b)||popularity(b)-popularity(a);
      else if(mode==='latest') difference=date(b)-date(a);
      else if(['likes','saves','downloads'].includes(mode)) difference=count(b,mode)-count(a,mode);
      return difference||rank(a)-rank(b)||String(a.id).localeCompare(String(b.id));
    });
  }
  globalThis.ScanSciSymbolDiscovery={featured,sort};
})();
