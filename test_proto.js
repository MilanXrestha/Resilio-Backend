const protobuf = require('protobufjs');
const path = require('path');

async function test() {
  const root = await protobuf.load(path.join(__dirname, 'protos/video.proto'));
  const Type = root.lookupType('resilio.video.Video');
  
  // Test with snake_case
  const dataSnake = {
    id: '123',
    video_url: 'http://test.com'
  };
  
  // Test with camelCase
  const dataCamel = {
    id: '123',
    videoUrl: 'http://test.com'
  };
  
  const msgSnake = Type.create(dataSnake);
  console.log('msgSnake:', msgSnake);
  
  const msgCamel = Type.create(dataCamel);
  console.log('msgCamel:', msgCamel);
  
  // Also what happens if we use Type.fromObject?
  const fromObjSnake = Type.fromObject(dataSnake);
  console.log('fromObjSnake:', fromObjSnake);
}

test().catch(console.error);
