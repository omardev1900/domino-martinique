"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomStatus = exports.GameDirection = void 0;
var GameDirection;
(function (GameDirection) {
    GameDirection[GameDirection["ANTI_CLOCKWISE"] = -1] = "ANTI_CLOCKWISE";
    GameDirection[GameDirection["CLOCKWISE"] = 1] = "CLOCKWISE";
})(GameDirection || (exports.GameDirection = GameDirection = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["WAITING"] = "WAITING";
    RoomStatus["PLAYING"] = "PLAYING";
    RoomStatus["FINISHED"] = "FINISHED";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
//# sourceMappingURL=types.js.map