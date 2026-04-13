const protobuf = require('protobufjs');
const path = require('path');

let root;

// Load all proto files
const loadProtos = async () => {
  if (!root) {
    root = await protobuf.load([
      path.join(__dirname, '../../protos/common.proto'),
      path.join(__dirname, '../../protos/auth.proto'),
      path.join(__dirname, '../../protos/user.proto'),
      path.join(__dirname, '../../protos/category.proto'),
      path.join(__dirname, '../../protos/quote.proto'),
      path.join(__dirname, '../../protos/audio.proto'),
      path.join(__dirname, '../../protos/video.proto'),
      path.join(__dirname, '../../protos/tips.proto'),
      path.join(__dirname, '../../protos/images.proto'),
      path.join(__dirname, '../../protos/subscription.proto'),
      path.join(__dirname, '../../protos/games.proto'),
    ]);
  }
  return root;
};

const protoMiddleware = async (req, res, next) => {
  try {
    const loadedRoot = await loadProtos();
    console.log('✓ Protobuf middleware initialized');

    // Add .proto() method to response object to send protobuf responses
    res.proto = (data, messageType) => {
      try {
        const Type = loadedRoot.lookupType(messageType);
        
        // Verify the payload
        const errMsg = Type.verify(data);
        if (errMsg) throw Error(errMsg);
    
        // Create a message
        const message = Type.create(data);
    
        // Encode to buffer
        const buffer = Type.encode(message).finish();
    
        // Send binary response
        res.set('Content-Type', 'application/x-protobuf');
        res.send(buffer);
      } catch (err) {
        console.error('Protobuf encoding error:', err);
        res.status(500).json({ error: 'Protobuf encoding failed' });
      }
    };

    // If request is protobuf, decode it
    if (req.is('application/x-protobuf') && req.body instanceof Buffer) {
      const messageType = req.header('X-Protobuf-Message-Type');
      if (messageType) {
        try {
          const Type = loadedRoot.lookupType(messageType);
          const decoded = Type.decode(req.body);
          req.body = Type.toObject(decoded, {
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            keepCase: false, // Convert snake_case to camelCase for JS
          });
        } catch (err) {
          console.error('Protobuf decoding error:', err);
          res.status(400).json({ error: 'Invalid protobuf message' });
          return;
        }
      }
    }

    next();
  } catch (err) {
    console.error('Proto middleware initialization error:', err);
    next(err);
  }
};

module.exports = { protoMiddleware };
