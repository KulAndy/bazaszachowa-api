{
  "targets": [
    {
      "target_name": "chess",
      "sources": [
        "chess_hashes.cpp"
      ],
      "include_dirs": [
        "../../node_modules/node-addon-api",
        "chess-library/include"
      ],
      "cflags_cc": [
        "-std=c++20",
        "-fexceptions"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS"
      ]
    }
  ]
}
