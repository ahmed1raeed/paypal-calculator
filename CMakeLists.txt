cmake_minimum_required(VERSION 3.20)
project(paypal_calculator CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# Standalone Asio
FetchContent_Declare(
    asio
    GIT_REPOSITORY https://github.com/chriskohlhoff/asio.git
    GIT_TAG        asio-1-30-2
    CONFIGURE_COMMAND ""
    BUILD_COMMAND     ""
)
FetchContent_MakeAvailable(asio)

# Provide ASIO_INCLUDE_DIR for Crow's Findasio.cmake
set(ASIO_INCLUDE_DIR "${asio_SOURCE_DIR}/asio/include" CACHE PATH "Path to Asio include" FORCE)

# Crow Framework
set(CROW_USE_BOOST OFF CACHE BOOL "" FORCE)
set(CROW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(CROW_BUILD_TESTS OFF CACHE BOOL "" FORCE)

FetchContent_Declare(
    crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG        v1.2.1.2
)
FetchContent_MakeAvailable(crow)

add_executable(paypal_calculator src/main.cpp)
target_link_libraries(paypal_calculator PRIVATE Crow::Crow)

if(WIN32)
    target_compile_definitions(paypal_calculator PRIVATE _WIN32_WINNT=0x0A00 NOMINMAX _CRT_SECURE_NO_WARNINGS)
    target_link_libraries(paypal_calculator PRIVATE ws2_32 mswsock)
endif()
