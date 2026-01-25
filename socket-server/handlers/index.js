import registerRoomHandlers from "./roomHandler.js";
import registerMemoHandlers from "./memoHandler.js";
import registerSettingHandlers from "./settingHandler.js";

export default (io) => {
  io.on("connection", (socket) => {
    // 각 핸들러 모듈 등록
    registerRoomHandlers(io, socket);
    registerMemoHandlers(io, socket);
    registerSettingHandlers(io, socket);
  });
};
