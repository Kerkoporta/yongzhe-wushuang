# v96 公网 MQTT 合包验收记录

测试方式：两个真实 Chromium 页面，通过公共 EMQX MQTT 收发，使用 100ms 周期；记录发送与到达包、到达延迟及 stale 状态。

最终合包样本：

```json
{
  "intervalMs": 100,
  "seconds": 6,
  "data": [
    {
      "name": "host→client",
      "sent": 59,
      "received": 55,
      "unaccounted": 4,
      "lossPercent": 6.8,
      "latencyMedianMs": 204,
      "latencyP95Ms": 288,
      "latencyMaxMs": 306,
      "snapSent": 59,
      "snapReceived": 55
    },
    {
      "name": "client→host",
      "sent": 55,
      "received": 52,
      "unaccounted": 3,
      "lossPercent": 5.5,
      "latencyMedianMs": 260,
      "latencyP95Ms": 328,
      "latencyMaxMs": 355,
      "stateSent": 55,
      "stateReceived": 52
    }
  ],
  "status": [
    {"name":"host","ready":true,"stale":false},
    {"name":"client","ready":true,"stale":false}
  ],
  "errors": []
}
```

此前相同 100ms 周期、房主分开发送状态与快照时，host→client 未到达 56.5%，client→host 未到达 10.7%。16ms 与 50ms 在公共通道上未改善实际到达能力，因此未采用。

注意：这是同机双客户端经公网中转的样本，不代表所有设备和网络。最后一次重复采样因工具授权超时未形成新数据，未写入新的通过记录；本文件保留的是此前实际成功完成的样本。
