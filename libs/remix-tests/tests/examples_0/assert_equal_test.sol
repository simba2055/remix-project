import "remix_tests.sol"; // this import is automatically injected by Remix.

contract AssertEqualTest {

    function equalUintPassTest() public {
        Assert.equal(uint(1), uint(1), "equalUintPassTest passes");
    }

    function equalUintFailTest() public {
        Assert.equal(uint(1), uint(2), "equalUintFailTest fails");
    }

    function equalIntPassTest() public {
        Assert.equal(-1, -1, "equalIntPassTest passes");
    }

    function equalIntFailTest() public {
        Assert.equal(-1, 2, "equalIntFailTest fails");
    }

    function equalBoolPassTest() public {
        Assert.equal(true, true, "equalBoolPassTest passes");
    }

    function equalBoolFailTest() public {
        Assert.equal(true, false, "equalBoolFailTest fails");
    }

    function equalAddressPassTest() public {
        Assert.equal(0x7994f14563F39875a2F934Ce42cAbF48a93FdDA9, 0x7994f14563F39875a2F934Ce42cAbF48a93FdDA9, "equalAddressPassTest passes");
    }

    function equalAddressFailTest() public {
        Assert.equal(0x7994f14563F39875a2F934Ce42cAbF48a93FdDA9, 0x1c6637567229159d1eFD45f95A6675e77727E013, "equalAddressFailTest fails");
    }
}