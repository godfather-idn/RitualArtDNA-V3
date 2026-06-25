// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract RitualArtworkRegistry {

    struct Artwork {
        string dna;
        string title;
        string artist;
        address owner;
        uint256 timestamp;
    }

    Artwork[] public artworks;

    event ArtworkRegistered(
        string dna,
        string title,
        string artist,
        address owner,
        uint256 timestamp
    );

    function registerArtwork(
        string memory _dna,
        string memory _title,
        string memory _artist
    ) public {

        Artwork memory newArtwork =
            Artwork({
                dna: _dna,
                title: _title,
                artist: _artist,
                owner: msg.sender,
                timestamp: block.timestamp
            });

        artworks.push(newArtwork);

        emit ArtworkRegistered(
            _dna,
            _title,
            _artist,
            msg.sender,
            block.timestamp
        );
    }

    function getArtwork(
        uint256 index
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            address,
            uint256
        )
    {
        Artwork memory art =
            artworks[index];

        return (
            art.dna,
            art.title,
            art.artist,
            art.owner,
            art.timestamp
        );
    }

    function totalArtworks()
        public
        view
        returns (uint256)
    {
        return artworks.length;
    }
}