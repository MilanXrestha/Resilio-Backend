const { CategoryRepository } = require('./src/data/repositories/category-repository');
const { VideoRepository } = require('./src/data/repositories/video-repository');

async function test() {
  const catRepo = new CategoryRepository();
  const vidRepo = new VideoRepository();
  
  try {
    const categories = await catRepo.findAll();
    console.log('Categories sample:', JSON.stringify(categories[0], null, 2));
    
    const videos = await vidRepo.getShortVideos();
    console.log('Videos sample:', JSON.stringify(videos[0], null, 2));
  } catch (e) {
    console.error('Test error:', e);
  }
}

test();
